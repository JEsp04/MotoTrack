import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import { ESTADOS_CERRADOS } from '../ordenes/estados.js';
import type { ActualizarMotoInput, CrearMotoInput, ListarMotosQuery } from './motos.schemas.js';

const PLACA_REPETIDA = 'Esta placa ya está registrada';
const MOTO_NO_ENCONTRADA = 'No encontramos esa moto';
const CLIENTE_NO_ENCONTRADO = 'No encontramos ese cliente';

/** Lo que se muestra de una moto, con su orden abierta si la tiene (HU-27). */
export const motoSelect = {
  publicId: true,
  placa: true,
  marca: true,
  referencia: true,
  modelo: true,
  cilindraje: true,
  color: true,
  kilometraje: true,
  creadoEn: true,
  cliente: { select: { publicId: true, nombre: true } },
  ordenes: {
    where: { estado: { notIn: ESTADOS_CERRADOS } },
    orderBy: { fechaIngreso: 'desc' },
    take: 1,
    select: { publicId: true, numero: true, estado: true, fechaIngreso: true },
  },
} satisfies Prisma.MotoSelect;

type MotoConOrdenes = Prisma.MotoGetPayload<{ select: typeof motoSelect }>;

/** Cambia la lista `ordenes` por `ordenActiva` (o null) */
export function aMotoPublica({ ordenes, ...moto }: MotoConOrdenes) {
  return { ...moto, ordenActiva: ordenes[0] ?? null };
}

const errorPlaca = () =>
  new HttpError(409, PLACA_REPETIDA, [{ field: 'placa', message: PLACA_REPETIDA }]);

async function placaDisponible(tallerId: number, placa: string, exceptoMotoId?: number) {
  const existe = await prisma.moto.findFirst({
    where: { tallerId, placa, NOT: exceptoMotoId ? { motocicletaId: exceptoMotoId } : undefined },
    select: { motocicletaId: true },
  });
  if (existe) throw errorPlaca();
}

/** La ficha de cliente del usuario con rol cliente (se crea al registrarse, HU-14) */
async function clienteDelUsuario(usuario: UsuarioAutenticado) {
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioId: usuario.usuarioId, tallerId: usuario.tallerId },
    select: { clienteId: true },
  });
  if (!cliente) throw HttpError.notFound('No encontramos tu ficha de cliente en el taller');
  return cliente.clienteId;
}

async function clientePorPublicId(tallerId: number, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(CLIENTE_NO_ENCONTRADO);
  const cliente = await prisma.cliente.findFirst({
    where: { publicId, tallerId },
    select: { clienteId: true },
  });
  if (!cliente) throw HttpError.notFound(CLIENTE_NO_ENCONTRADO);
  return cliente.clienteId;
}

/**
 * GET /api/motos (HU-26, HU-27).
 * Cliente: solo las suyas, sin importar los filtros. Admin y mecánico: las del taller.
 */
export async function listarMotos(usuario: UsuarioAutenticado, query: ListarMotosQuery) {
  const where: Prisma.MotoWhereInput = { tallerId: usuario.tallerId };
  if (usuario.rol === 'cliente') {
    where.clienteId = await clienteDelUsuario(usuario);
  } else {
    if (query.cliente) where.clienteId = await clientePorPublicId(usuario.tallerId, query.cliente);
    if (query.q) where.placa = { contains: query.q.replace(/[\s-]/g, '').toUpperCase() };
  }

  const [motos, total] = await Promise.all([
    prisma.moto.findMany({
      where,
      select: motoSelect,
      orderBy: { creadoEn: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.moto.count({ where }),
  ]);
  return { data: motos.map(aMotoPublica), meta: { page: query.page, limit: query.limit, total } };
}

/** POST /api/motos (HU-26) */
export async function crearMoto(usuario: UsuarioAutenticado, input: CrearMotoInput) {
  let clienteId: number;
  if (usuario.rol === 'cliente') {
    // Siempre a su nombre, aunque envíe otro cliente
    clienteId = await clienteDelUsuario(usuario);
  } else {
    if (!input.clientePublicId) {
      throw HttpError.badRequest('Datos inválidos', [
        { field: 'clientePublicId', message: 'Elige el cliente' },
      ]);
    }
    clienteId = await clientePorPublicId(usuario.tallerId, input.clientePublicId);
  }

  await placaDisponible(usuario.tallerId, input.placa);
  const { clientePublicId: _c, ...datos } = input;
  try {
    const moto = await prisma.moto.create({
      data: { ...datos, tallerId: usuario.tallerId, clienteId },
      select: motoSelect,
    });
    return aMotoPublica(moto);
  } catch (error) {
    if (esDuplicado(error, 'placa')) throw errorPlaca();
    throw error;
  }
}

/** PATCH /api/motos/:id · El cliente solo puede editar las suyas (si no, 404). */
export async function actualizarMoto(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: ActualizarMotoInput,
) {
  if (!esPublicId(publicId)) throw HttpError.notFound(MOTO_NO_ENCONTRADA);
  const where: Prisma.MotoWhereInput = { publicId, tallerId: usuario.tallerId };
  if (usuario.rol === 'cliente') where.clienteId = await clienteDelUsuario(usuario);

  const moto = await prisma.moto.findFirst({ where, select: { motocicletaId: true } });
  if (!moto) throw HttpError.notFound(MOTO_NO_ENCONTRADA);
  if (input.placa) await placaDisponible(usuario.tallerId, input.placa, moto.motocicletaId);

  try {
    const actualizada = await prisma.moto.update({
      where: { motocicletaId: moto.motocicletaId },
      data: input,
      select: motoSelect,
    });
    return aMotoPublica(actualizada);
  } catch (error) {
    if (esDuplicado(error, 'placa')) throw errorPlaca();
    throw error;
  }
}
