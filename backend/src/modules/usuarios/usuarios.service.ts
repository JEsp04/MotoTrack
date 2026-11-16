import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import type { Prisma, Rol } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import type { ActualizarMecanicoInput, CrearMecanicoInput } from './usuarios.schemas.js';

const BCRYPT_COSTO = 12;
const CORREO_REGISTRADO = 'Este correo ya está registrado';
const NO_ENCONTRADO = 'No encontramos ese mecánico';

/** Lo que se muestra de un integrante del equipo. Nunca passwordHash ni los Int. */
const integrante = {
  publicId: true,
  nombre: true,
  email: true,
  telefono: true,
  rol: true,
  estado: true,
  ultimoAcceso: true,
  creadoEn: true,
} satisfies Prisma.UsuarioSelect;

/** GET /api/usuarios · El equipo del taller (admins y mecánicos; nunca clientes). */
export function listarEquipo(tallerId: number, rol?: Extract<Rol, 'admin' | 'mecanico'>) {
  return prisma.usuario.findMany({
    where: { tallerId, rol: rol ?? { in: ['admin', 'mecanico'] } },
    select: integrante,
    orderBy: [{ estado: 'asc' }, { nombre: 'asc' }],
  });
}

/** POST /api/usuarios (HU-23) */
export async function crearMecanico(tallerId: number, input: CrearMecanicoInput) {
  const existe = await prisma.usuario.findUnique({
    where: { email: input.email },
    select: { usuarioId: true },
  });
  if (existe)
    throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COSTO);
  try {
    return await prisma.usuario.create({
      data: {
        tallerId, // siempre el del admin, sin importar lo que se envíe
        rol: 'mecanico',
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        passwordHash,
      },
      select: integrante,
    });
  } catch (error) {
    if (esDuplicado(error, 'email'))
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
    throw error;
  }
}

/**
 * PATCH /api/usuarios/:id · Solo mecánicos del mismo taller (si es de otro taller: 404).
 * Al desactivarlo se cierran sus sesiones; su historial se conserva.
 */
export async function actualizarMecanico(
  tallerId: number,
  publicId: string,
  input: ActualizarMecanicoInput,
) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const mecanico = await prisma.usuario.findFirst({
    where: { publicId, tallerId, rol: 'mecanico' },
    select: { usuarioId: true },
  });
  if (!mecanico) throw HttpError.notFound(NO_ENCONTRADO);

  return prisma.$transaction(async (tx) => {
    const actualizado = await tx.usuario.update({
      where: { usuarioId: mecanico.usuarioId },
      data: {
        nombre: input.nombre,
        telefono: input.telefono,
        estado: input.estado,
      },
      select: integrante,
    });
    if (input.estado === 'inactivo') {
      await tx.refreshToken.updateMany({
        where: { usuarioId: mecanico.usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
    }
    return actualizado;
  });
}
