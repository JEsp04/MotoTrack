import { z } from 'zod';

const texto = (campo: string, max: number) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo} admite máximo ${max} caracteres`);

export const emailSchema = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Escribe un correo válido').max(150, 'El correo admite máximo 150 caracteres'));

/** Mínimo 8 caracteres, con al menos una letra y un número */
export const passwordSchema = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña admite máximo 72 caracteres')
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'La contraseña debe tener al menos una letra')
  .regex(/\d/, 'La contraseña debe tener al menos un número');

/** Celular o fijo colombiano: 10 dígitos (se ignoran espacios y guiones) */
export const telefonoSchema = z
  .string({ error: 'El teléfono es obligatorio' })
  .max(20, 'El teléfono admite máximo 20 caracteres')
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'));

export const documentoSchema = z
  .string({ error: 'El documento es obligatorio' })
  .max(30, 'El documento admite máximo 30 caracteres')
  .transform((v) => v.replace(/[\s.]/g, ''))
  .pipe(z.string().regex(/^[0-9A-Za-z]{5,20}$/, 'Escribe un documento válido, sin puntos'));

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

export type RegisterTallerInput = z.infer<typeof registerTallerSchema>;
export type RegisterClienteInput = z.infer<typeof registerClienteSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
