import { z } from 'zod';

/**
 * Validaciones de los formularios de auth.
 * Son las mismas reglas del backend (backend/src/modules/auth/auth.schemas.ts),
 * para avisar antes de enviar. El backend vuelve a validar siempre.
 */

/**
 * Largo máximo de cada campo. Es el mismo del backend y de la base de datos,
 * y se usa también como `maxLength` en los inputs para que no se pueda escribir de más.
 */
export const LIMITES = {
  nombre: 150,
  email: 150,
  password: 72,
  telefono: 20,
  documento: 30,
  nit: 20,
  direccion: 255,
} as const;

const obligatorio = (campo: string) => z.string().trim().min(1, `${campo} es obligatorio`);

const email = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .max(LIMITES.email, `Máximo ${LIMITES.email} caracteres`)
  .pipe(z.email('Escribe un correo válido'));

const password = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .max(LIMITES.password, `Máximo ${LIMITES.password} caracteres`)
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'Debe tener al menos una letra')
  .regex(/\d/, 'Debe tener al menos un número');

const soloDigitos = (v: string) => v.replace(/[\s-]/g, '');

const telefono = z
  .string()
  .trim()
  .min(1, 'El teléfono es obligatorio')
  .max(LIMITES.telefono, `Máximo ${LIMITES.telefono} caracteres`)
  .refine((v) => /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

const telefonoOpcional = z
  .string()
  .trim()
  .max(LIMITES.telefono, `Máximo ${LIMITES.telefono} caracteres`)
  .refine((v) => v === '' || /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

const documento = z
  .string()
  .trim()
  .min(1, 'El documento es obligatorio')
  .max(LIMITES.documento, `Máximo ${LIMITES.documento} caracteres`)
  .refine(
    (v) => /^[0-9A-Za-z]{5,20}$/.test(v.replace(/[\s.]/g, '')),
    'Escribe un documento válido, sin puntos',
  );

const confirmarClave = <T extends { password: string; confirmar: string }>(datos: T) =>
  datos.password === datos.confirmar;

// ─── Ingreso (HU-19) ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(LIMITES.password, `Máximo ${LIMITES.password} caracteres`),
});
export type LoginForm = z.infer<typeof loginSchema>;

// ─── Registro de taller en 2 pasos (HU-20) ─────────────────────────────────

export const tallerPaso1Schema = z.object({
  nombre: obligatorio('El nombre del taller').max(
    LIMITES.nombre,
    `Máximo ${LIMITES.nombre} caracteres`,
  ),
  nit: z
    .string()
    .trim()
    .max(LIMITES.nit, `Máximo ${LIMITES.nit} caracteres`)
    .regex(/^[0-9-]*$/, 'Solo números y guion'),
  telefono,
  direccion: z.string().trim().max(LIMITES.direccion, `Máximo ${LIMITES.direccion} caracteres`),
});

export const adminPaso2Schema = z
  .object({
    nombre: obligatorio('Tu nombre').max(LIMITES.nombre, `Máximo ${LIMITES.nombre} caracteres`),
    email,
    telefono: telefonoOpcional,
    password,
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(confirmarClave, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });

export const registroTallerSchema = z.object({
  taller: tallerPaso1Schema,
  admin: adminPaso2Schema,
});
export type RegistroTallerForm = z.infer<typeof registroTallerSchema>;

// ─── Registro de cliente (HU-20) ───────────────────────────────────────────

export const registroClienteSchema = z
  .object({
    tallerPublicId: z.string().min(1, 'Elige tu taller'),
    nombre: obligatorio('Tu nombre').max(LIMITES.nombre, `Máximo ${LIMITES.nombre} caracteres`),
    documentoIdentidad: documento,
    telefono,
    email,
    password,
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(confirmarClave, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });
export type RegistroClienteForm = z.infer<typeof registroClienteSchema>;
