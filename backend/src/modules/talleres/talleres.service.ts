import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import type { ActualizarTallerInput } from './talleres.schemas.js';

/** Lo que se muestra del taller. Nunca el tallerId. */
const DATOS_TALLER = {
  publicId: true,
  nombre: true,
  nit: true,
  direccion: true,
  telefono: true,
  email: true,
  horarioAtencion: true,
} as const;

/** GET /api/talleres/mio (HU-73) · Datos del taller de quien inició sesión */
export async function obtenerMiTaller(tallerId: number) {
  const taller = await prisma.taller.findUnique({ where: { tallerId }, select: DATOS_TALLER });
  if (!taller) throw HttpError.notFound('No encontramos tu taller');
  return taller;
}

/** PATCH /api/talleres/mio (HU-73) · Solo el admin, y solo su propio taller */
export async function actualizarMiTaller(tallerId: number, input: ActualizarTallerInput) {
  try {
    return await prisma.taller.update({ where: { tallerId }, data: input, select: DATOS_TALLER });
  } catch (error) {
    if (esDuplicado(error, 'nit')) {
      throw new HttpError(409, 'Ese NIT ya está registrado en otro taller', [
        { field: 'nit', message: 'Ese NIT ya está registrado en otro taller. Revisa el número' },
      ]);
    }
    throw error;
  }
}
