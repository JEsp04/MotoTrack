import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import type {
  ActualizarRepuestoInput,
  CrearRepuestoInput,
  ListarRepuestosQuery,
  RegistrarMovimientoInput,
} from './repuestos.schemas.js';

const NOMBRE_REPETIDO = 'Ya existe un repuesto con este nombre en el taller';
const NO_ENCONTRADO = 'No encontramos ese repuesto';
const SIN_UNIDADES = 'No hay suficientes unidades';

/** Lo que se muestra de un repuesto. Nunca los Int. */
const repuestoSelect = {
  publicId: true,
  nombre: true,
  referencia: true,
  categoria: true,
  precioVenta: true,
  costo: true,
  stock: true,
  stockMinimo: true,
  proveedor: true,
  motosCompatibles: true,
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.RepuestoSelect;

const movimientoSelect = {
  publicId: true,
  tipo: true,
  cantidad: true,
  stockResultante: true,
  referencia: true,
  creadoEn: true,
  orden: { select: { publicId: true, numero: true } },
  usuario: { select: { publicId: true, nombre: true } },
} satisfies Prisma.MovimientoStockSelect;

type RepuestoBase = Prisma.RepuestoGetPayload<{ select: typeof repuestoSelect }>;

/**
 * Agrega lo que calcula el backend:
 * - critico: stock menor o igual al mínimo.
 * - margen: (precio − costo) / precio, en porcentaje entero (31 = 31 %). Vacío si no hay costo.
 */
function aRepuestoPublico<T extends RepuestoBase>(repuesto: T) {
  const { precioVenta, costo } = repuesto;
  return {
    ...repuesto,
    critico: repuesto.stock <= repuesto.stockMinimo,
    margen: costo === null ? null : Math.round(((precioVenta - costo) / precioVenta) * 100),
  };
}

/** Filtro del buscador: nombre, referencia o motos compatibles (sin distinguir mayúsculas). */
function filtroBusqueda(q: string): Prisma.RepuestoWhereInput {
  return {
    OR: [
      { nombre: { contains: q } },
      { referencia: { contains: q } },
      { motosCompatibles: { contains: q } },
    ],
  };
}

/** Stock crítico: stock <= stockMinimo (comparación entre dos columnas) */
function filtroCritico(critico: boolean | undefined): Prisma.RepuestoWhereInput {
  const minimo = prisma.repuesto.fields.stockMinimo;
  if (critico === true) return { stock: { lte: minimo } };
  if (critico === false) return { stock: { gt: minimo } };
  return {};
}

/** GET /api/repuestos (HU-52) */
export async function listarRepuestos(tallerId: number, query: ListarRepuestosQuery) {
  const where: Prisma.RepuestoWhereInput = {
    tallerId,
    activo: query.activo,
    ...(query.categoria ? { categoria: query.categoria } : {}),
    ...(query.q ? filtroBusqueda(query.q) : {}),
    ...filtroCritico(query.critico),
  };
  const [repuestos, total] = await Promise.all([
    prisma.repuesto.findMany({
      where,
      select: repuestoSelect,
      orderBy: { nombre: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.repuesto.count({ where }),
  ]);
  return {
    data: repuestos.map(aRepuestoPublico),
    meta: { page: query.page, limit: query.limit, total },
  };
}

async function buscarRepuesto(tallerId: number, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const repuesto = await prisma.repuesto.findFirst({
    where: { publicId, tallerId },
    select: { repuestoId: true },
  });
  // Un repuesto de otro taller responde 404, no 403
  if (!repuesto) throw HttpError.notFound(NO_ENCONTRADO);
  return repuesto.repuestoId;
}

/** El repuesto con sus últimos 20 movimientos, del más reciente al más antiguo */
async function detalle(repuestoId: number) {
  const repuesto = await prisma.repuesto.findUniqueOrThrow({
    where: { repuestoId },
    select: {
      ...repuestoSelect,
      movimientos: {
        select: movimientoSelect,
        orderBy: [{ creadoEn: 'desc' }, { movimientoStockId: 'desc' }],
        take: 20,
      },
    },
  });
  return aRepuestoPublico(repuesto);
}

/** GET /api/repuestos/:id (HU-52) */
export async function obtenerRepuesto(tallerId: number, publicId: string) {
  return detalle(await buscarRepuesto(tallerId, publicId));
}

const errorNombre = () =>
  new HttpError(409, NOMBRE_REPETIDO, [{ field: 'nombre', message: NOMBRE_REPETIDO }]);

/** El nombre es único dentro del taller (sin distinguir mayúsculas, por la collation de MySQL) */
async function exigirNombreLibre(tallerId: number, nombre: string, excepto?: number) {
  const existe = await prisma.repuesto.findFirst({
    where: { tallerId, nombre, ...(excepto ? { repuestoId: { not: excepto } } : {}) },
    select: { repuestoId: true },
  });
  if (existe) throw errorNombre();
}

/** POST /api/repuestos (HU-52). Si trae stock inicial, se guarda como un movimiento de entrada. */
export async function crearRepuesto(usuario: UsuarioAutenticado, input: CrearRepuestoInput) {
  const { tallerId } = usuario;
  await exigirNombreLibre(tallerId, input.nombre);
  try {
    const repuesto = await prisma.repuesto.create({
      data: {
        ...input,
        tallerId, // siempre el del admin, sin importar lo que se envíe
        movimientos:
          input.stock > 0
            ? {
                create: {
                  tallerId,
                  tipo: 'entrada',
                  cantidad: input.stock,
                  stockResultante: input.stock,
                  referencia: 'Stock inicial',
                  usuarioId: usuario.usuarioId,
                },
              }
            : undefined,
      },
      select: { repuestoId: true },
    });
    return detalle(repuesto.repuestoId);
  } catch (error) {
    if (esDuplicado(error, 'nombre')) throw errorNombre();
    throw error;
  }
}

/** PATCH /api/repuestos/:id (HU-52). El stock no se cambia aquí, sino con un movimiento. */
export async function actualizarRepuesto(
  tallerId: number,
  publicId: string,
  input: ActualizarRepuestoInput,
) {
  const repuestoId = await buscarRepuesto(tallerId, publicId);
  if (input.nombre) await exigirNombreLibre(tallerId, input.nombre, repuestoId);
  try {
    await prisma.repuesto.update({ where: { repuestoId }, data: input });
  } catch (error) {
    if (esDuplicado(error, 'nombre')) throw errorNombre();
    throw error;
  }
  return detalle(repuestoId);
}

// ─── HU-53 · Movimientos de stock ──────────────────────────────────────────

/** Stock que queda después del movimiento y la cantidad que se guarda en el historial */
function calcularMovimiento(stockAnterior: number, input: RegistrarMovimientoInput) {
  if (input.tipo === 'entrada') {
    return { stockNuevo: stockAnterior + input.cantidad, cantidad: input.cantidad };
  }
  if (input.tipo === 'salida') {
    if (input.cantidad > stockAnterior) {
      throw new HttpError(409, SIN_UNIDADES, [
        { field: 'cantidad', message: `${SIN_UNIDADES}: hay ${stockAnterior}` },
      ]);
    }
    return { stockNuevo: stockAnterior - input.cantidad, cantidad: input.cantidad };
  }
  // Ajuste: el stock queda en el valor contado y se guarda la diferencia
  return { stockNuevo: input.cantidad, cantidad: input.cantidad - stockAnterior };
}

/**
 * POST /api/repuestos/:id/movimientos (HU-53).
 * Entrada suma, salida resta y ajuste deja el stock en el valor dado.
 * La fila del repuesto queda bloqueada (SELECT … FOR UPDATE) hasta que termina la transacción:
 * dos salidas al mismo tiempo se hacen una después de la otra y el stock nunca queda negativo.
 */
export async function registrarMovimiento(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: RegistrarMovimientoInput,
) {
  const repuestoId = await buscarRepuesto(usuario.tallerId, publicId);

  await prisma.$transaction(async (tx) => {
    const [fila] = await tx.$queryRaw<Array<{ stock: number }>>`
      SELECT stock FROM repuestos WHERE repuestoId = ${repuestoId} FOR UPDATE`;
    if (!fila) throw HttpError.notFound(NO_ENCONTRADO);
    const { stockNuevo, cantidad } = calcularMovimiento(Number(fila.stock), input);

    await tx.repuesto.update({ where: { repuestoId }, data: { stock: stockNuevo } });
    await tx.movimientoStock.create({
      data: {
        tallerId: usuario.tallerId,
        repuestoId,
        tipo: input.tipo,
        cantidad,
        stockResultante: stockNuevo,
        referencia: input.referencia,
        usuarioId: usuario.usuarioId,
      },
    });
  });

  return detalle(repuestoId);
}
