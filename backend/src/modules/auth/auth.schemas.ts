import { z } from 'zod';
import {
  documentoSchema,
  emailSchema,
  passwordSchema,
  telefonoEditable,
  telefonoSchema,
  texto,
} from '../../utils/schemas.js';

export { documentoSchema, emailSchema, passwordSchema, telefonoSchema };

/** POST /api/auth/register-taller (HU-13) */
export const registerTallerSchema = z.object({
  taller: z.object({
    nombre: texto('El nombre del taller', 150),
    nit: z
      .string()
      .trim()
      .max(20, 'El NIT admite máximo 20 caracteres')
      .regex(/^[0-9-]*$/, 'El NIT solo admite números y guion')
      .optional()
      .transform((v) => v || undefined),
    telefono: telefonoSchema,
    direccion: z.string().trim().max(255).optional(),
  }),
  admin: z.object({
    nombre: texto('Tu nombre', 150),
    email: emailSchema,
    password: passwordSchema,
    telefono: telefonoSchema.optional(),
  }),
});

/** POST /api/auth/register (HU-14). El rol siempre es cliente: cualquier "rol" enviado se ignora. */
export const registerClienteSchema = z.object({
  /** publicId del taller (de GET /talleres/publicos) */
  tallerPublicId: z.uuid({ error: 'Elige tu taller' }),
  nombre: texto('Tu nombre', 150),
  documentoIdentidad: documentoSchema,
  telefono: telefonoSchema,
  email: emailSchema,
  password: passwordSchema,
});

/** POST /api/auth/login (HU-15) */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .max(72, 'La contraseña admite máximo 72 caracteres'),
});

/** PATCH /api/auth/perfil (HU-86). Campo ausente = no cambia; teléfono '' o null lo borra. */
export const actualizarPerfilSchema = z
  .object({
    nombre: texto('Tu nombre', 150).optional(),
    email: emailSchema.optional(),
    telefono: telefonoEditable,
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

/** PATCH /api/auth/password (HU-86) */
export const cambiarPasswordSchema = z
  .object({
    passwordActual: z
      .string({ error: 'Escribe tu contraseña actual' })
      .min(1, 'Escribe tu contraseña actual')
      .max(72, 'La contraseña admite máximo 72 caracteres'),
    passwordNueva: passwordSchema,
  })
  .refine((d) => d.passwordActual !== d.passwordNueva, {
    path: ['passwordNueva'],
    message: 'La contraseña nueva debe ser distinta de la actual',
  });

/** HU-91 · POST /api/auth/talleres y POST /api/auth/taller-activo */
export const tallerClienteSchema = z.object({
  tallerPublicId: z.uuid({ error: 'Elige un taller' }),
});

export type TallerClienteInput = z.infer<typeof tallerClienteSchema>;
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>;
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
export type RegisterTallerInput = z.infer<typeof registerTallerSchema>;
export type RegisterClienteInput = z.infer<typeof registerClienteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
