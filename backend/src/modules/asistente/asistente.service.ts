import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { modeloIA } from './asistente.ia.js';
import type { ConsultarInput } from './asistente.schemas.js';

const MOTO_NO_ENCONTRADA = 'No encontramos esa moto';
export const AVISO_SUGERENCIA =
  'Es una sugerencia generada por IA. El diagnóstico real lo hace el mecánico en el taller.';

/** Medianoche de hoy en Colombia (UTC-5, sin horario de verano), expresada en UTC */
export function inicioDelDiaColombia(ahora = new Date()) {
  const OFFSET = 5 * 60 * 60 * 1000;
  const local = new Date(ahora.getTime() - OFFSET);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET);
}

async function usadosHoy(usuarioId: number) {
  return prisma.consultaAsistente.count({
    where: { usuarioId, creadoEn: { gte: inicioDelDiaColombia() } },
  });
}

function resumenCupo(usados: number) {
  const limite = env.ASISTENTE_LIMITE_DIARIO;
  return { limite, usados, restantes: Math.max(0, limite - usados) };
}

/** GET /api/asistente · Si el asistente está encendido y cuántas consultas le quedan hoy */
export async function estado(usuario: UsuarioAutenticado) {
  return {
    disponible: Boolean(env.ANTHROPIC_API_KEY),
    ...resumenCupo(await usadosHoy(usuario.usuarioId)),
  };
}

/**
 * La moto y sus últimos servicios en texto, para que el asistente los tenga en cuenta.
 * El cliente solo puede usar sus motos del taller activo; el personal, cualquiera del taller.
 */
async function contextoMoto(usuario: UsuarioAutenticado, motoPublicId: string) {
  const moto = await prisma.moto.findFirst({
    where: {
      publicId: motoPublicId,
      tallerId: usuario.tallerId,
      ...(usuario.rol === 'cliente' ? { cliente: { usuarioId: usuario.usuarioId } } : {}),
    },
    select: {
      marca: true,
      referencia: true,
      modelo: true,
      cilindraje: true,
      kilometraje: true,
      ordenes: {
        where: { estado: { in: ['entregada', 'cerrada'] } },
        orderBy: { fechaIngreso: 'desc' },
        take: 5,
        select: {
          fechaIngreso: true,
          kilometrajeIngreso: true,
          motivoIngreso: true,
          diagnostico: { select: { hallazgos: true } },
          servicios: { select: { servicio: { select: { nombre: true } } } },
        },
      },
    },
  });
  if (!moto) throw HttpError.notFound(MOTO_NO_ENCONTRADA);

  const cc = moto.cilindraje ? ` ${moto.cilindraje} cc` : '';
  const lineas = [
    `Moto: ${moto.marca} ${moto.referencia}${cc}, modelo ${moto.modelo}, ${moto.kilometraje.toLocaleString('es-CO')} km.`,
  ];
  if (moto.ordenes.length === 0) {
    lineas.push('No hay servicios anteriores registrados en el taller.');
  } else {
    lineas.push('Últimos servicios en el taller:');
    for (const o of moto.ordenes) {
      const servicios = o.servicios
        .map((d) => d.servicio?.nombre)
        .filter(Boolean)
        .join(', ');
      const hallazgos = o.diagnostico?.hallazgos.slice(0, 200);
      lineas.push(
        `- ${o.fechaIngreso.toISOString().slice(0, 10)}, ${o.kilometrajeIngreso} km: ${o.motivoIngreso.slice(0, 150)}` +
          (servicios ? `. Servicios: ${servicios}` : '') +
          (hallazgos ? `. Hallazgos: ${hallazgos}` : ''),
      );
    }
  }
  return lineas.join('\n');
}

function instrucciones(rol: UsuarioAutenticado['rol'], moto: string | null) {
  const publico =
    rol === 'cliente'
      ? 'Hablas con el dueño de la moto, que no es mecánico: usa palabras sencillas, sin tecnicismos. En "consejo" di qué puede hacer mientras llega al taller y si es seguro usarla.'
      : 'Hablas con un mecánico del taller: puedes ser técnico. En "pruebas" da pruebas concretas para confirmar la causa (con valores de referencia si aplica).';
  return [
    'Eres el asistente de diagnóstico de MotoTrack, un software para talleres de motos en Medellín, Colombia.',
    'Respondes siempre en español de Colombia, en frases cortas y claras.',
    publico,
    'Solo ayudas con síntomas y mantenimiento de motos. Si te preguntan otra cosa, di amablemente que solo puedes ayudar con la moto y responde con tipo "pregunta".',
    'Si falta un dato clave para orientar (cuándo pasa, qué se oye, desde cuándo), responde con tipo "pregunta", diagnostico null, una sola pregunta en "texto" y de 2 a 4 respuestas cortas en "opciones".',
    'Cuando ya puedas orientar, responde con tipo "diagnostico": en "texto" una frase de introducción, y en "diagnostico" el título del problema más probable, la urgencia (alta si no es seguro usarla, media si debe revisarse pronto, baja si puede esperar), un resumen de 1 o 2 frases, de 2 a 4 causas ordenadas de más a menos probable, de 1 a 3 pruebas, un costo estimado como rango en pesos colombianos (por ejemplo "$ 70.000 – $ 110.000"), un consejo y un motivo corto para pedir la cita (máximo 60 caracteres). En "opciones" pon ["Hacer otra consulta"].',
    'Nunca afirmes un diagnóstico como seguro: es una orientación y el diagnóstico real lo hace el mecánico.',
    moto
      ? `Datos de la moto del taller:\n${moto}`
      : 'No hay datos de la moto: oriéntate solo por lo que te cuentan.',
  ].join('\n\n');
}

/**
 * POST /api/asistente/consultas · Revisa el límite diario ANTES de llamar a la API
 * (si se pasó, responde 429 sin gastar). Solo cuenta las respuestas que sí llegaron.
 */
export async function consultar(usuario: UsuarioAutenticado, input: ConsultarInput) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new HttpError(
      503,
      'El asistente IA no está activado en este taller. Pide al administrador que lo configure.',
    );
  }
  const usados = await usadosHoy(usuario.usuarioId);
  if (usados >= env.ASISTENTE_LIMITE_DIARIO) {
    throw new HttpError(
      429,
      `Ya usaste tus ${env.ASISTENTE_LIMITE_DIARIO} consultas de hoy. Mañana puedes volver a preguntar, o escríbele al taller.`,
    );
  }

  const moto = input.motoId ? await contextoMoto(usuario, input.motoId) : null;
  const respuesta = await modeloIA.consultar(instrucciones(usuario.rol, moto), input.mensajes);

  await prisma.consultaAsistente.create({
    data: { tallerId: usuario.tallerId, usuarioId: usuario.usuarioId },
  });

  return {
    tipo: respuesta.tipo,
    texto: respuesta.texto,
    opciones: respuesta.opciones.slice(0, 4),
    diagnostico: respuesta.diagnostico && {
      ...respuesta.diagnostico,
      causas: respuesta.diagnostico.causas.slice(0, 5),
      pruebas: respuesta.diagnostico.pruebas.slice(0, 5),
      motivoCita: respuesta.diagnostico.motivoCita.slice(0, 120),
      aviso: AVISO_SUGERENCIA,
    },
    ...resumenCupo(usados + 1),
  };
}
