import { prisma } from '../../config/prisma.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esPublicId } from '../../utils/schemas.js';
import { reglaPorId, reglasDeServicio, type ReglaMantenimiento } from './recordatorios.reglas.js';
import type { ListarRecordatoriosQuery, RechazarInput } from './recordatorios.schemas.js';

const NO_ENCONTRADO = 'No encontramos ese recordatorio';
const km = new Intl.NumberFormat('es-CO');

/** Meses completos entre dos fechas */
export function mesesEntre(desde: Date, hasta: Date) {
  let meses =
    (hasta.getUTCFullYear() - desde.getUTCFullYear()) * 12 +
    (hasta.getUTCMonth() - desde.getUTCMonth());
  if (hasta.getUTCDate() < desde.getUTCDate()) meses--;
  return Math.max(0, meses);
}

/**
 * ¿Ya le toca? Devuelve el «Por qué» si la moto cumplió el intervalo: primero por
 * kilometraje («último cambio de aceite hace 3.500 km») y si no, por tiempo («… hace 4 meses»).
 */
export function porQue(regla: ReglaMantenimiento, kmRecorridos: number, meses: number) {
  if (kmRecorridos >= regla.cadaKm) return `${regla.ultimo} hace ${km.format(kmRecorridos)} km`;
  if (meses >= regla.cadaMeses)
    return `${regla.ultimo} hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  return null;
}

/**
 * HU-75 · Calcula qué motos del taller cumplen su intervalo según su última orden entregada con
 * cada servicio y su kilometraje actual:
 * - crea el recordatorio pendiente si aún no existe para esa moto, regla y orden (si ya se
 *   rechazó o aprobó, no vuelve a salir);
 * - actualiza el «Por qué» de los pendientes (los km cambian);
 * - quita los pendientes que ya no aplican (por ejemplo, porque el servicio se hizo otra vez).
 */
export async function calcular(tallerId: number, ahora = new Date()) {
  const ordenes = await prisma.ordenServicio.findMany({
    where: { tallerId, estado: { in: ['entregada', 'cerrada'] }, fechaEntrega: { not: null } },
    orderBy: [{ fechaEntrega: 'desc' }, { ordenServicioId: 'desc' }],
    select: {
      ordenServicioId: true,
      motocicletaId: true,
      kilometrajeIngreso: true,
      fechaEntrega: true,
      moto: { select: { kilometraje: true } },
      servicios: { select: { servicio: { select: { nombre: true } } } },
    },
  });

  // La última orden de cada moto con cada regla (vienen de la más nueva a la más vieja)
  const vigentes = new Map<
    string,
    { orden: (typeof ordenes)[number]; regla: ReglaMantenimiento }
  >();
  for (const o of ordenes) {
    for (const d of o.servicios) {
      if (!d.servicio) continue;
      for (const regla of reglasDeServicio(d.servicio.nombre)) {
        const clave = `${o.motocicletaId}:${regla.id}`;
        if (!vigentes.has(clave)) vigentes.set(clave, { orden: o, regla });
      }
    }
  }

  const tocan = new Map<string, string>();
  for (const { orden, regla } of vigentes.values()) {
    const motivo = porQue(
      regla,
      orden.moto.kilometraje - orden.kilometrajeIngreso,
      mesesEntre(orden.fechaEntrega!, ahora),
    );
    if (motivo) tocan.set(`${orden.motocicletaId}:${regla.id}:${orden.ordenServicioId}`, motivo);
  }

  const existentes = await prisma.recordatorio.findMany({
    where: { tallerId },
    select: {
      recordatorioId: true,
      motocicletaId: true,
      regla: true,
      ordenServicioId: true,
      estado: true,
      porQue: true,
    },
  });
  const yaEstan = new Set(
    existentes.map((r) => `${r.motocicletaId}:${r.regla}:${r.ordenServicioId}`),
  );

  const nuevos = [...tocan]
    .filter(([clave]) => !yaEstan.has(clave))
    .map(([clave, motivo]) => {
      const [motocicletaId, regla, ordenServicioId] = clave.split(':');
      return {
        tallerId,
        motocicletaId: Number(motocicletaId),
        regla: regla!,
        ordenServicioId: Number(ordenServicioId),
        porQue: motivo,
      };
    });

  const pendientes = existentes.filter((r) => r.estado === 'pendiente');
  const sobran = pendientes.filter(
    (r) => !tocan.has(`${r.motocicletaId}:${r.regla}:${r.ordenServicioId}`),
  );
  const cambian = pendientes.flatMap((r) => {
    const motivo = tocan.get(`${r.motocicletaId}:${r.regla}:${r.ordenServicioId}`);
    return motivo && motivo !== r.porQue ? [{ id: r.recordatorioId, porQue: motivo }] : [];
  });

  await prisma.$transaction([
    prisma.recordatorio.createMany({ data: nuevos, skipDuplicates: true }),
    prisma.recordatorio.deleteMany({
      where: { recordatorioId: { in: sobran.map((r) => r.recordatorioId) } },
    }),
    ...cambian.map((c) =>
      prisma.recordatorio.update({
        where: { recordatorioId: c.id },
        data: { porQue: c.porQue },
      }),
    ),
  ]);
}

const recordatorioSelect = {
  publicId: true,
  regla: true,
  estado: true,
  porQue: true,
  motivo: true,
  revisadoEn: true,
  creadoEn: true,
  revisadoPor: { select: { nombre: true } },
  orden: { select: { publicId: true, numero: true, fechaEntrega: true } },
  moto: {
    select: {
      publicId: true,
      placa: true,
      marca: true,
      referencia: true,
      kilometraje: true,
      cliente: { select: { publicId: true, nombre: true, telefono: true, usuarioId: true } },
    },
  },
} as const;

type Fila = Awaited<ReturnType<typeof buscar>>[number];

function buscar(tallerId: number, estado: ListarRecordatoriosQuery['estado']) {
  return prisma.recordatorio.findMany({
    where: {
      tallerId,
      estado: estado === 'pendiente' ? 'pendiente' : { in: ['aprobado', 'rechazado'] },
    },
    orderBy:
      estado === 'pendiente'
        ? [{ creadoEn: 'asc' }, { recordatorioId: 'asc' }]
        : [{ revisadoEn: 'desc' }, { recordatorioId: 'desc' }],
    select: recordatorioSelect,
  });
}

/** Lo que se responde: sin Int y con el título de la regla. `tieneCuenta` en vez de usuarioId. */
function respuesta(r: Fila) {
  const { usuarioId, ...cliente } = r.moto.cliente;
  return {
    publicId: r.publicId,
    titulo: reglaPorId(r.regla)?.titulo ?? r.regla,
    estado: r.estado,
    porQue: r.porQue,
    motivo: r.motivo,
    revisadoEn: r.revisadoEn,
    revisadoPor: r.revisadoPor,
    creadoEn: r.creadoEn,
    ultimoServicio: r.orden,
    moto: { ...r.moto, cliente: { ...cliente, tieneCuenta: usuarioId !== null } },
  };
}

/** GET /api/recordatorios · Calcula y lista los pendientes o los ya revisados */
export async function listar(tallerId: number, query: ListarRecordatoriosQuery) {
  await calcular(tallerId);
  const [filas, pendientes] = await Promise.all([
    buscar(tallerId, query.estado),
    prisma.recordatorio.findMany({
      where: { tallerId, estado: 'pendiente' },
      select: { motocicletaId: true },
    }),
  ]);
  return {
    data: filas.map(respuesta),
    meta: {
      page: 1,
      limit: filas.length,
      total: filas.length,
      pendientes: pendientes.length,
      /** Para «N motos cumplen su intervalo esta semana» */
      motos: new Set(pendientes.map((p) => p.motocicletaId)).size,
    },
  };
}

async function pendienteDelTaller(tallerId: number, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const r = await prisma.recordatorio.findFirst({
    where: { publicId, tallerId },
    select: {
      recordatorioId: true,
      estado: true,
      regla: true,
      tallerId: true,
      taller: { select: { nombre: true } },
      moto: {
        select: {
          placa: true,
          marca: true,
          referencia: true,
          cliente: { select: { nombre: true, usuarioId: true } },
        },
      },
    },
  });
  if (!r) throw HttpError.notFound(NO_ENCONTRADO);
  if (r.estado !== 'pendiente') throw HttpError.conflict('Este recordatorio ya fue revisado');
  return r;
}

/** El mensaje para el cliente, el mismo del aviso y del enlace de WhatsApp */
function mensaje(r: Awaited<ReturnType<typeof pendienteDelTaller>>) {
  const titulo = reglaPorId(r.regla)?.titulo ?? r.regla;
  const nombre = r.moto.cliente.nombre.split(' ')[0];
  const moto = `${r.moto.marca} ${r.moto.referencia} (${r.moto.placa})`;
  return {
    titulo,
    texto: `Según el historial de tu ${moto}, te recomendamos: ${titulo.toLowerCase()}. Pide tu cita en la app de ${r.taller.nombre}.`,
    whatsapp: `Hola ${nombre}, según el historial de tu ${moto}, te recomendamos: ${titulo.toLowerCase()}.\n\nPide tu cita en la app de ${r.taller.nombre} o responde este mensaje.`,
  };
}

/**
 * POST /api/recordatorios/:id/aprobar · Lo marca aprobado y, si el cliente tiene cuenta, le
 * deja un aviso en la app (HU-69). Devuelve el mensaje para abrir WhatsApp (HU-68).
 */
export async function aprobar(usuario: UsuarioAutenticado, publicId: string) {
  const r = await pendienteDelTaller(usuario.tallerId, publicId);
  const m = mensaje(r);
  await prisma.$transaction(async (tx) => {
    await tx.recordatorio.update({
      where: { recordatorioId: r.recordatorioId },
      data: { estado: 'aprobado', revisadoPorId: usuario.usuarioId, revisadoEn: new Date() },
    });
    if (r.moto.cliente.usuarioId) {
      await tx.aviso.create({
        data: {
          tallerId: r.tallerId,
          usuarioId: r.moto.cliente.usuarioId,
          tipo: 'recordatorio',
          titulo: `Te toca: ${m.titulo.toLowerCase()}`,
          texto: m.texto,
        },
      });
    }
  });
  const [fila] = await prisma.recordatorio
    .findMany({ where: { recordatorioId: r.recordatorioId }, select: recordatorioSelect })
    .then((f) => f.map(respuesta));
  return { ...fila!, mensaje: m.whatsapp };
}

/** POST /api/recordatorios/:id/rechazar · No se envía nada al cliente */
export async function rechazar(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: RechazarInput,
) {
  const r = await pendienteDelTaller(usuario.tallerId, publicId);
  await prisma.recordatorio.update({
    where: { recordatorioId: r.recordatorioId },
    data: {
      estado: 'rechazado',
      motivo: input.motivo,
      revisadoPorId: usuario.usuarioId,
      revisadoEn: new Date(),
    },
  });
  const [fila] = await prisma.recordatorio
    .findMany({ where: { recordatorioId: r.recordatorioId }, select: recordatorioSelect })
    .then((f) => f.map(respuesta));
  return fila!;
}
