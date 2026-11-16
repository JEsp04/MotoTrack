import { z } from 'zod';
import { leerHorario } from '../citas/horario.js';
import { emailEditable, telefonoSchema, texto, textoEditable } from '../../utils/schemas.js';

/** Ejemplo que se muestra cuando no entendemos el horario */
export const EJEMPLO_HORARIO = 'Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00';

/**
 * Horario de atención: '' o null lo borra (las citas usan el horario por defecto).
 * Si trae texto, debe entenderse con las mismas reglas de las citas (HU-57).
 */
const horarioEditable = textoEditable('El horario', 255).refine(
  (v) => v === undefined || v === null || leerHorario(v) !== null,
  `No entendimos el horario. Escríbelo así: «${EJEMPLO_HORARIO}»`,
);

/** PATCH /api/talleres/mio (HU-73). Campo ausente = no cambia. */
export const actualizarTallerSchema = z
  .object({
    nombre: texto('El nombre del taller', 150).optional(),
    nit: z
      .union([
        z.literal('').transform(() => null),
        z.null(),
        z
          .string()
          .trim()
          .max(20, 'El NIT admite máximo 20 caracteres')
          .regex(/^[0-9-]*$/, 'El NIT solo admite números y guion')
          .transform((v) => v || null),
      ])
      .optional(),
    direccion: textoEditable('La dirección', 255),
    telefono: telefonoSchema.optional(),
    email: emailEditable,
    horarioAtencion: horarioEditable,
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

export type ActualizarTallerInput = z.infer<typeof actualizarTallerSchema>;
