import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import { aMotoPublica, motoSelect } from '../motos/motos.service.js';
import type {
  ActualizarClienteInput,
  CrearClienteInput,
  ListarClientesQuery,
} from './clientes.schemas.js';

const DOCUMENTO_REPETIDO = 'Ya existe un cliente con este documento';
const NO_ENCONTRADO = 'No encontramos ese cliente';

/** Datos de un cliente en la lista. usuarioId solo se usa para saber si tiene cuenta. */
const clienteResumen = {
  publicId: true,
  nombre: true,
  documentoIdentidad: true,
  telefono: true,
  email: true,
  usuarioId: true,
  creadoEn: true,
  motos: { select: { publicId: true, placa: true }, orderBy: { creadoEn: 'asc' } },
} satisfies Prisma.ClienteSelect;

/** Cambia usuarioId (Int interno) por tieneCuenta */
function sinIds<T extends { usuarioId: number | null }>({ usuarioId, ...cliente }: T) {
  return { ...cliente, tieneCuenta: usuarioId !== null };
}

/**
 * Filtro del buscador (HU-25): nombre, documento, teléfono o placa.
 * La comparación no distingue mayúsculas (collation de MySQL).
 */
function filtroBusqueda(q: string): Prisma.ClienteWhereInput {
  const compacto = q.replace(/[\s.-]/g, '');
  const filtros: Prisma.ClienteWhereInput[] = [{ nombre: { contains: q } }];
  if (compacto) {
    filtros.push(
      { documentoIdentidad: { contains: compacto } },
      { telefono: { contains: compacto } },
      { motos: { some: { placa: { contains: compacto.toUpperCase() } } } },
    );
  }
  return { OR: filtros };
}

/** GET /api/clientes */
export async function listarClientes(tallerId: number, query: ListarClientesQuery) {
  const where: Prisma.ClienteWhereInput = {
    tallerId,
    ...(query.q ? filtroBusqueda(query.q) : {}),
  };
  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      select: clienteResumen,
      orderBy: { nombre: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.cliente.count({ where }),
  ]);
  return { data: clientes.map(sinIds), meta: { page: query.page, limit: query.limit, total } };
}

async function buscarCliente(tallerId: number, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const cliente = await prisma.cliente.findFirst({
    where: { publicId, tallerId },
    select: { clienteId: true },
  });
  // Un cliente de otro taller responde 404, no 403
  if (!cliente) throw HttpError.notFound(NO_ENCONTRADO);
  return cliente.clienteId;
}

/** GET /api/clientes/:id · Sus datos, sus motos y sus últimas órdenes (HU-25) */
export async function obtenerCliente(tallerId: number, publicId: string) {
  const clienteId = await buscarCliente(tallerId, publicId);
  const [cliente, ordenes] = await Promise.all([
    prisma.cliente.findUniqueOrThrow({
      where: { clienteId },
      select: {
        publicId: true,
        nombre: true,
        documentoIdentidad: true,
        telefono: true,
        email: true,
        direccion: true,
        usuarioId: true,
        creadoEn: true,
        motos: { select: motoSelect, orderBy: { creadoEn: 'asc' } },
      },
    }),
    prisma.ordenServicio.findMany({
      where: { tallerId, moto: { clienteId } },
      select: {
        publicId: true,
        numero: true,
        estado: true,
        fechaIngreso: true,
        costoTotal: true,
        moto: { select: { publicId: true, placa: true } },
      },
      orderBy: { fechaIngreso: 'desc' },
      take: 20,
    }),
  ]);
  const { motos, ...datos } = sinIds(cliente);
  return { ...datos, motos: motos.map(aMotoPublica), ordenes };
}

const errorDocumento = () =>
  new HttpError(409, DOCUMENTO_REPETIDO, [
    { field: 'documentoIdentidad', message: DOCUMENTO_REPETIDO },
  ]);

/** POST /api/clientes (HU-24) */
export async function crearCliente(tallerId: number, input: CrearClienteInput) {
  const existe = await prisma.cliente.findFirst({
    where: { tallerId, documentoIdentidad: input.documentoIdentidad },
    select: { clienteId: true },
  });
  if (existe) throw errorDocumento();
  try {
    const cliente = await prisma.cliente.create({
      data: { ...input, tallerId },
      select: clienteResumen,
    });
    return sinIds(cliente);
  } catch (error) {
    if (esDuplicado(error, 'documentoIdentidad')) throw errorDocumento();
    throw error;
  }
}

/** PATCH /api/clientes/:id (HU-25, alterno B) */
export async function actualizarCliente(
  tallerId: number,
  publicId: string,
  input: ActualizarClienteInput,
) {
  const clienteId = await buscarCliente(tallerId, publicId);
  const cliente = await prisma.cliente.update({
    where: { clienteId },
    data: input,
    select: clienteResumen,
  });
  return sinIds(cliente);
}
