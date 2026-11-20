import { prisma } from '../../config/prisma.js';
import type { EstadoOrden, Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esPublicId } from '../../utils/schemas.js';
import type { ListarAvisosQuery } from './avisos.schemas.js';
import { avisoParaCliente, avisoParaTaller } from './avisos.textos.js';

const NO_ENCONTRADO = 'No encontramos ese aviso';

/** Lo que se responde de un aviso. Nunca los Int. */
const avisoSelect = {
  publicId: true,
  tipo: true,
  titulo: true,
  texto: true,
  leido: true,
  creadoEn: true,
  orden: { select: { publicId: true, numero: true } },
} as const;

// ─── Crear avisos (siempre dentro de la transacción del cambio) ────────────

/**
 * HU-69 · Crea los avisos de un cambio de estado en la misma transacción:
 * - al cliente dueño, si tiene cuenta;
 * - a los admin activos del taller, si fue el cliente quien aprobó o rechazó desde la app.
 * Si el cambio falla, la transacción se deshace y no queda ningún aviso.
 */
export async function crearAvisosDeEstado(
  tx: Prisma.TransactionClient,
  cambio: {
    ordenServicioId: number;
    de: EstadoOrden | null;
    a: EstadoOrden;
    observacion: string | null;
    /** El cambio lo hizo el cliente dueño desde la app */
    porCliente?: boolean;
  },
) {
  const orden = await tx.ordenServicio.findUniqueOrThrow({
    where: { ordenServicioId: cambio.ordenServicioId },
    select: {
      tallerId: true,
      numero: true,
      moto: { select: { placa: true, cliente: { select: { nombre: true, usuarioId: true } } } },
    },
  });
  const datos = { numero: orden.numero, placa: orden.moto.placa };
  const base = { tallerId: orden.tallerId, ordenServicioId: cambio.ordenServicioId };
  const avisos: Prisma.AvisoCreateManyInput[] = [];

  // Alterno: el cliente no tiene cuenta, no se crea aviso para él
  const clienteUsuarioId = orden.moto.cliente.usuarioId;
  if (clienteUsuarioId) {
    avisos.push({
      ...base,
      usuarioId: clienteUsuarioId,
      ...avisoParaCliente(datos, cambio.de, cambio.a, cambio.observacion),
    });
  }

  if (cambio.porCliente && cambio.de === 'esperando_aprobacion') {
    const admins = await tx.usuario.findMany({
      where: { tallerId: orden.tallerId, rol: 'admin', estado: 'activo' },
      select: { usuarioId: true },
    });
    const texto = avisoParaTaller(
      datos,
      orden.moto.cliente.nombre,
      cambio.a === 'aprobada',
      cambio.observacion,
    );
    for (const { usuarioId } of admins) avisos.push({ ...base, usuarioId, ...texto });
  }

  if (avisos.length > 0) await tx.aviso.createMany({ data: avisos });
}

// ─── API /api/avisos ───────────────────────────────────────────────────────

/** GET /api/avisos · Solo los del usuario que pregunta, del más nuevo al más viejo */
export async function listarAvisos(usuario: UsuarioAutenticado, query: ListarAvisosQuery) {
  // HU-91 · Un cliente en varios talleres ve los avisos del taller activo
  const where = {
    usuarioId: usuario.usuarioId,
    tallerId: usuario.tallerId,
    ...(query.noLeidos ? { leido: false } : {}),
  };
  const [data, total, noLeidos] = await Promise.all([
    prisma.aviso.findMany({
      where,
      select: avisoSelect,
      orderBy: [{ creadoEn: 'desc' }, { avisoId: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.aviso.count({ where }),
    prisma.aviso.count({
      where: { usuarioId: usuario.usuarioId, tallerId: usuario.tallerId, leido: false },
    }),
  ]);
  return { data, meta: { page: query.page, limit: query.limit, total, noLeidos } };
}

/** PATCH /api/avisos/:id/leido · Un aviso de otro usuario responde 404 */
export async function marcarLeido(usuario: UsuarioAutenticado, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const { count } = await prisma.aviso.updateMany({
    where: { publicId, usuarioId: usuario.usuarioId },
    data: { leido: true },
  });
  if (count === 0) throw HttpError.notFound(NO_ENCONTRADO);
  return prisma.aviso.findUniqueOrThrow({ where: { publicId }, select: avisoSelect });
}

/** POST /api/avisos/leer-todos */
export async function leerTodos(usuario: UsuarioAutenticado) {
  const { count } = await prisma.aviso.updateMany({
    where: { usuarioId: usuario.usuarioId, tallerId: usuario.tallerId, leido: false },
    data: { leido: true },
  });
  return { actualizados: count };
}
