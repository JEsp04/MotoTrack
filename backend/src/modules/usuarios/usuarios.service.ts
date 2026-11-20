import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import type { Prisma, Rol } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import { restablecerPassword } from '../auth/auth.service.js';
import type { ActualizarIntegranteInput, CrearMecanicoInput } from './usuarios.schemas.js';

const BCRYPT_COSTO = 12;
const CORREO_REGISTRADO = 'Este correo ya está registrado';
const NO_ENCONTRADO = 'No encontramos a esa persona en tu equipo';
const SIN_ADMIN = 'El taller debe tener al menos un administrador activo';

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
 * PATCH /api/usuarios/:id · Admins y mecánicos del mismo taller (de otro taller: 404).
 * HU-87: el admin también corrige el rol (mecánico ↔ admin), pero el taller nunca queda sin
 * un administrador activo (400). Al desactivar o cambiar el rol se cierran sus sesiones, para
 * que vuelva a ingresar con los permisos nuevos; su historial se conserva.
 */
export async function actualizarIntegrante(
  tallerId: number,
  publicId: string,
  input: ActualizarIntegranteInput,
) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADO);
  const integranteActual = await prisma.usuario.findFirst({
    where: { publicId, tallerId, rol: { in: ['admin', 'mecanico'] } },
    select: { usuarioId: true, rol: true, estado: true },
  });
  if (!integranteActual) throw HttpError.notFound(NO_ENCONTRADO);

  const cambiaRol = input.rol !== undefined && input.rol !== integranteActual.rol;
  const rolFinal = input.rol ?? integranteActual.rol;
  const estadoFinal = input.estado ?? integranteActual.estado;
  const dejaDeSerAdmin =
    integranteActual.rol === 'admin' &&
    integranteActual.estado === 'activo' &&
    (rolFinal !== 'admin' || estadoFinal !== 'activo');

  return prisma.$transaction(async (tx) => {
    if (dejaDeSerAdmin) {
      const otrosAdmins = await tx.usuario.count({
        where: {
          tallerId,
          rol: 'admin',
          estado: 'activo',
          usuarioId: { not: integranteActual.usuarioId },
        },
      });
      if (otrosAdmins === 0) {
        throw HttpError.badRequest(SIN_ADMIN, [
          { field: input.rol !== undefined ? 'rol' : 'estado', message: SIN_ADMIN },
        ]);
      }
    }
    const actualizado = await tx.usuario.update({
      where: { usuarioId: integranteActual.usuarioId },
      data: {
        nombre: input.nombre,
        telefono: input.telefono,
        rol: input.rol,
        estado: input.estado,
      },
      select: integrante,
    });
    if (input.estado === 'inactivo' || cambiaRol) {
      await tx.refreshToken.updateMany({
        where: { usuarioId: integranteActual.usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
    }
    return actualizado;
  });
}

/**
 * POST /api/usuarios/:id/reset-password (HU-86) · Clave temporal para un integrante del
 * equipo. El admin no se la restablece a sí mismo: para eso está «Cambiar contraseña».
 */
export async function restablecerClaveIntegrante(
  admin: { usuarioId: number; tallerId: number },
  publicId: string,
) {
  const NO_ESTA = 'No encontramos a esa persona en tu equipo';
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ESTA);
  const usuario = await prisma.usuario.findFirst({
    where: { publicId, tallerId: admin.tallerId, rol: { in: ['admin', 'mecanico'] } },
    select: { usuarioId: true, nombre: true, telefono: true },
  });
  if (!usuario) throw HttpError.notFound(NO_ESTA);
  if (usuario.usuarioId === admin.usuarioId) {
    throw HttpError.conflict('Para tu propia clave usa «Cambiar contraseña» en Mi cuenta');
  }
  const claveTemporal = await restablecerPassword(usuario.usuarioId);
  return { nombre: usuario.nombre, telefono: usuario.telefono, claveTemporal };
}
