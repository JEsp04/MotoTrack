import { z } from 'zod';
import {
  documento,
  email,
  LIMITES,
  maximo,
  obligatorio,
  password,
  telefono,
  telefonoOpcional,
} from '@/lib/validaciones';

/**
 * Validaciones de los formularios de auth.
 * Son las mismas reglas del backend (backend/src/modules/auth/auth.schemas.ts),
 * para avisar antes de enviar. El backend vuelve a validar siempre.
 */

export { LIMITES };

const confirmarClave = <T extends { password: string; confirmar: string }>(datos: T) =>
  datos.password === datos.confirmar;

// ─── Ingreso (HU-19) ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .max(LIMITES.password, maximo(LIMITES.password)),
});
export type LoginForm = z.infer<typeof loginSchema>;

// ─── Registro de taller en 2 pasos (HU-20) ─────────────────────────────────

export const tallerPaso1Schema = z.object({
  nombre: obligatorio('El nombre del taller').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  nit: z
    .string()
    .trim()
    .max(LIMITES.nit, maximo(LIMITES.nit))
    .regex(/^[0-9-]*$/, 'Solo números y guion'),
  telefono,
  direccion: z.string().trim().max(LIMITES.direccion, maximo(LIMITES.direccion)),
});

export const adminPaso2Schema = z
  .object({
    nombre: obligatorio('Tu nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
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
    nombre: obligatorio('Tu nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
    documentoIdentidad: documento,
    telefono,
    email,
    password,
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(confirmarClave, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });
export type RegistroClienteForm = z.infer<typeof registroClienteSchema>;
