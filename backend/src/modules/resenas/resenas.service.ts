import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import type {
  ActualizarResenaInput,
  CrearResenaInput,
  ListarResenasQuery,
} from './resenas.schemas.js';

const ORDEN_NO_ENCONTRADA = 'No encontramos esa orden';
const NO_ENCONTRADA = 'No encontramos esa reseña';
const YA_CALIFICADA = 'Ya calificaste esta orden. ¡Gracias!';

/** HU-89 · Lo que se muestra de una reseña dentro del detalle de la orden. Nunca los Int. */
export const resenaSelect = {
  publicId: true,
  calificacion: true,
  aspectos: true,
  comentario: true,
  estado: true,
  respuestaAdmin: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.ResenaOrdenSelect;

/** En la lista del admin, además, la orden, la moto y el cliente */
const resenaListaSelect = {
  ...resenaSelect,
  orden: {
    select: {
      publicId: true,
      numero: true,
      moto: { select: { placa: true, marca: true, referencia: true } },
    },
  },
  cliente: { select: { publicId: true, nombre: true } },
} satisfies Prisma.ResenaOrdenSelect;

/** Los aspectos se guardan separados por coma y se responden como lista */
export function aResenaPublica<T extends { aspectos: string | null }>(resena: T) {
  return { ...resena, aspectos: resena.aspectos ? resena.aspectos.split(', ') : [] };
}

/**
 * POST /api/ordenes/:id/resena · Solo el cliente dueño, con la orden entregada o cerrada.
 * Una sola reseña por orden (409). Avisa a los admin activos del taller.
 */
export async function crearResena(
  usuario: UsuarioAutenticado,
  ordenPublicId: string,
  input: CrearResenaInput,
) {
  if (!esPublicId(ordenPublicId)) throw HttpError.notFound(ORDEN_NO_ENCONTRADA);
  const orden = await prisma.ordenServicio.findFirst({
    where: {
      publicId: ordenPublicId,
      tallerId: usuario.tallerId,
      moto: { cliente: { usuarioId: usuario.usuarioId } },
    },
    select: {
      ordenServicioId: true,
      numero: true,
      estado: true,
      resena: { select: { resenaOrdenId: true } },
      moto: { select: { placa: true, cliente: { select: { clienteId: true, nombre: true } } } },
    },
  });
  if (!orden) throw HttpError.notFound(ORDEN_NO_ENCONTRADA);
  if (orden.estado !== 'entregada' && orden.estado !== 'cerrada') {
    throw HttpError.conflict('Podrás calificar el servicio cuando te entreguen la moto');
  }
  if (orden.resena) throw HttpError.conflict(YA_CALIFICADA);

  try {
    const resena = await prisma.$transaction(async (tx) => {
      const creada = await tx.resenaOrden.create({
        data: {
          tallerId: usuario.tallerId,
          ordenServicioId: orden.ordenServicioId,
          clienteId: orden.moto.cliente.clienteId,
          calificacion: input.calificacion,
          aspectos: input.aspectos.length ? input.aspectos.join(', ') : null,
          comentario: input.comentario,
        },
        select: resenaSelect,
      });
      const admins = await tx.usuario.findMany({
        where: { tallerId: usuario.tallerId, rol: 'admin', estado: 'activo' },
        select: { usuarioId: true },
      });
      const estrellas = `${input.calificacion} ${input.calificacion === 1 ? 'estrella' : 'estrellas'}`;
      await tx.aviso.createMany({
        data: admins.map(({ usuarioId }) => ({
          tallerId: usuario.tallerId,
          usuarioId,
          ordenServicioId: orden.ordenServicioId,
          tipo: 'resena' as const,
          titulo: `Nueva reseña · ${estrellas}`,
          texto: `Orden #${orden.numero} · ${orden.moto.placa}. ${orden.moto.cliente.nombre} calificó el servicio con ${input.calificacion} de 5.`,
        })),
      });
      return creada;
    });
    return aResenaPublica(resena);
  } catch (error) {
    // Dos envíos al mismo tiempo: el índice único de la orden lo frena
    if (esDuplicado(error, 'ordenServicioId')) throw HttpError.conflict(YA_CALIFICADA);
    throw error;
  }
}

/** GET /api/resenas (admin) · Con el promedio y las pendientes de todo el taller en `meta` */
export async function listarResenas(tallerId: number, query: ListarResenasQuery) {
  const where: Prisma.ResenaOrdenWhereInput = {
    tallerId,
    ...(query.calificacion ? { calificacion: query.calificacion } : {}),
    ...(query.estado ? { estado: query.estado } : {}),
  };
  const [data, total, resumen, pendientes] = await Promise.all([
    prisma.resenaOrden.findMany({
      where,
      select: resenaListaSelect,
      orderBy: [{ creadoEn: 'desc' }, { resenaOrdenId: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.resenaOrden.count({ where }),
    prisma.resenaOrden.aggregate({
      where: { tallerId },
      _avg: { calificacion: true },
      _count: { _all: true },
    }),
    prisma.resenaOrden.count({ where: { tallerId, estado: 'pendiente' } }),
  ]);
  const promedio = resumen._avg.calificacion;
  return {
    data: data.map(aResenaPublica),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      promedio: promedio === null ? null : Math.round(promedio * 10) / 10,
      totalResenas: resumen._count._all,
      pendientes,
    },
  };
}

/**
 * PATCH /api/resenas/:id (admin) · Responde y marca como revisada o adaptada.
 * Si hay una respuesta nueva y el cliente tiene cuenta, le llega un aviso.
 */
export async function actualizarResena(
  tallerId: number,
  publicId: string,
  input: ActualizarResenaInput,
) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADA);
  const actual = await prisma.resenaOrden.findFirst({
    where: { publicId, tallerId },
    select: {
      resenaOrdenId: true,
      ordenServicioId: true,
      respuestaAdmin: true,
      estado: true,
      orden: { select: { numero: true, moto: { select: { placa: true } } } },
      cliente: { select: { usuarioId: true } },
    },
  });
  if (!actual) throw HttpError.notFound(NO_ENCONTRADA);

  // Responder sin elegir estado la deja como revisada
  const estado =
    input.estado ??
    (input.respuestaAdmin && actual.estado === 'pendiente' ? 'revisada' : undefined);
  const respuestaNueva =
    input.respuestaAdmin !== undefined &&
    input.respuestaAdmin !== null &&
    input.respuestaAdmin !== actual.respuestaAdmin;

  const resena = await prisma.$transaction(async (tx) => {
    const actualizada = await tx.resenaOrden.update({
      where: { resenaOrdenId: actual.resenaOrdenId },
      data: { respuestaAdmin: input.respuestaAdmin, estado },
      select: resenaListaSelect,
    });
    if (respuestaNueva && actual.cliente.usuarioId) {
      await tx.aviso.create({
        data: {
          tallerId,
          usuarioId: actual.cliente.usuarioId,
          ordenServicioId: actual.ordenServicioId,
          tipo: 'resena',
          titulo: 'El taller respondió tu reseña',
          texto: `Orden #${actual.orden.numero} · ${actual.orden.moto.placa}. Mira la respuesta en el detalle de tu orden.`,
        },
      });
    }
    return actualizada;
  });
  return aResenaPublica(resena);
}
