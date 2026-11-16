import { randomInt } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import type { EstadoInvitacion, Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import { revisarIntentos, sumarFallo } from './intentos.js';
import {
  ALFABETO_CODIGO,
  LARGO_CODIGO,
  type CrearInvitacionInput,
} from './invitaciones.schemas.js';

export const DIAS_VIGENCIA = 7;
const DIA_MS = 24 * 60 * 60 * 1000;
const NO_ENCONTRADA = 'No encontramos esa invitación';
const CORREO_REGISTRADO = 'Este correo ya está registrado';
export const CODIGO_NO_VALIDO = 'Código no válido';

/** Estado que ve la gente: «vencida» se calcula, no se guarda */
export type EstadoVisible = EstadoInvitacion | 'vencida';

export function estadoVisible(i: { estado: EstadoInvitacion; venceEn: Date }, ahora = new Date()) {
  return i.estado === 'pendiente' && i.venceEn < ahora ? 'vencida' : i.estado;
}

/** Título del mensaje de cada estado que no sirve (los textos del prototipo) */
export const MENSAJE_ESTADO: Record<Exclude<EstadoVisible, 'pendiente'>, string> = {
  vencida: 'Invitación vencida',
  usada: 'Esta invitación ya se usó',
  cancelada: 'Invitación cancelada',
};

const vencimiento = () => new Date(Date.now() + DIAS_VIGENCIA * DIA_MS);

function generarCodigo() {
  let codigo = '';
  for (let i = 0; i < LARGO_CODIGO; i++)
    codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  return codigo;
}

/** Lo que el admin ve de cada invitación de su taller. Nunca los Int. */
const paraAdmin = {
  publicId: true,
  nombre: true,
  telefono: true,
  email: true,
  rol: true,
  codigo: true,
  estado: true,
  venceEn: true,
  creadoEn: true,
  actualizadoEn: true,
  invitadoPor: { select: { nombre: true } },
} satisfies Prisma.InvitacionSelect;

type InvitacionAdmin = Prisma.InvitacionGetPayload<{ select: typeof paraAdmin }>;

function aRespuesta({ invitadoPor, ...i }: InvitacionAdmin) {
  return { ...i, estado: estadoVisible(i), invito: invitadoPor.nombre };
}

/** GET /api/invitaciones · Las del taller del admin, las más nuevas primero */
export async function listarInvitaciones(tallerId: number) {
  const lista = await prisma.invitacion.findMany({
    where: { tallerId },
    select: paraAdmin,
    orderBy: { creadoEn: 'desc' },
  });
  return lista.map(aRespuesta);
}

/** POST /api/invitaciones · Crea la invitación con un código nuevo que vence en 7 días */
export async function crearInvitacion(
  actor: { tallerId: number; usuarioId: number },
  input: CrearInvitacionInput,
) {
  if (input.email) {
    const existe = await prisma.usuario.findUnique({
      where: { email: input.email },
      select: { usuarioId: true },
    });
    if (existe)
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
  }
  // El código es único: si sale uno repetido, se prueba con otro
  for (let intento = 0; ; intento++) {
    try {
      const creada = await prisma.invitacion.create({
        data: {
          tallerId: actor.tallerId,
          invitadoPorId: actor.usuarioId,
          nombre: input.nombre,
          telefono: input.telefono,
          email: input.email,
          rol: input.rol,
          codigo: generarCodigo(),
          venceEn: vencimiento(),
        },
        select: paraAdmin,
      });
      return aRespuesta(creada);
    } catch (error) {
      if (intento < 5 && esDuplicado(error, 'codigo')) continue;
      throw error;
    }
  }
}

async function pendienteDelTaller(tallerId: number, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADA);
  const invitacion = await prisma.invitacion.findFirst({
    where: { publicId, tallerId },
    select: { invitacionId: true, estado: true },
  });
  if (!invitacion) throw HttpError.notFound(NO_ENCONTRADA);
  if (invitacion.estado === 'usada')
    throw HttpError.conflict('Esta invitación ya se usó: la cuenta ya existe');
  if (invitacion.estado === 'cancelada')
    throw HttpError.conflict('Esta invitación está cancelada. Crea una nueva');
  return invitacion;
}

/** POST /api/invitaciones/:id/reenviar · Vuelve a dar 7 días (también si ya había vencido) */
export async function reenviarInvitacion(tallerId: number, publicId: string) {
  const { invitacionId } = await pendienteDelTaller(tallerId, publicId);
  const actualizada = await prisma.invitacion.update({
    where: { invitacionId },
    data: { venceEn: vencimiento() },
    select: paraAdmin,
  });
  return aRespuesta(actualizada);
}

/** POST /api/invitaciones/:id/cancelar · El código deja de servir */
export async function cancelarInvitacion(tallerId: number, publicId: string) {
  const { invitacionId } = await pendienteDelTaller(tallerId, publicId);
  const actualizada = await prisma.invitacion.update({
    where: { invitacionId },
    data: { estado: 'cancelada' },
    select: paraAdmin,
  });
  return aRespuesta(actualizada);
}

/**
 * Busca una invitación por su código, sin sesión. Un código que no existe suma un intento
 * fallido para esa IP (ver intentos.ts) y responde 404 «Código no válido».
 */
export async function buscarPorCodigo(codigo: string, ip: string) {
  revisarIntentos(ip);
  const invitacion = /^[A-Z0-9]{4}$/.test(codigo)
    ? await prisma.invitacion.findUnique({
        where: { codigo },
        select: {
          invitacionId: true,
          tallerId: true,
          nombre: true,
          telefono: true,
          email: true,
          rol: true,
          estado: true,
          venceEn: true,
          invitadoPor: { select: { nombre: true } },
          taller: { select: { nombre: true, estado: true } },
        },
      })
    : null;
  if (!invitacion || invitacion.taller.estado !== 'activo') {
    sumarFallo(ip);
    throw new HttpError(404, CODIGO_NO_VALIDO, [{ field: 'codigo', message: CODIGO_NO_VALIDO }]);
  }
  return invitacion;
}

/** Enmascara el celular para mostrar solo los últimos 4 dígitos en la consulta pública. */
function enmascararTelefono(telefono: string) {
  if (telefono.length <= 4) return '•'.repeat(telefono.length);
  return `${'•'.repeat(telefono.length - 4)}${telefono.slice(-4)}`;
}

/**
 * GET /api/invitaciones/codigo/:codigo (pública) · Para la pantalla «Únete a tu taller».
 * Si la invitación ya no sirve, solo dice por qué, quién invitó y cuándo vencía:
 * los datos del invitado no se muestran. Si está pendiente, el celular va enmascarado.
 */
export async function validarCodigo(codigo: string, ip: string) {
  const i = await buscarPorCodigo(codigo, ip);
  const estado = estadoVisible(i);
  const base = { estado, invito: i.invitadoPor.nombre, venceEn: i.venceEn };
  if (estado !== 'pendiente') return base;
  return {
    ...base,
    taller: { nombre: i.taller.nombre },
    nombre: i.nombre,
    telefono: enmascararTelefono(i.telefono),
    email: i.email,
    rol: i.rol,
  };
}
