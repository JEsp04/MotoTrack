import { z } from 'zod';
import {
  emailOpcional,
  emailSchema,
  passwordSchema,
  telefonoSchema,
  texto,
} from '../../utils/schemas.js';

/** Letras y números que no se confunden al leerlos: sin 0, O, 1 ni I (igual que el prototipo) */
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const LARGO_CODIGO = 4;

/** El código como lo escribe la persona: se aceptan minúsculas y espacios */
export const codigoSchema = z
  .string({ error: 'Escribe el código de invitación' })
  .max(20, 'Código no válido')
  .transform((v) => v.replace(/\s/g, '').toUpperCase());

/** POST /api/invitaciones (HU-67). El taller y quien invita salen de la sesión. */
export const crearInvitacionSchema = z.object({
  nombre: texto('El nombre', 150),
  telefono: telefonoSchema,
  email: emailOpcional,
  rol: z.enum(['mecanico', 'admin'], { error: 'Elige Mecánico o Administrador' }),
});

/** POST /api/auth/register-invitacion (HU-67). El rol y el taller salen de la invitación. */
export const registroInvitacionSchema = z.object({
  codigo: codigoSchema,
  nombre: texto('Tu nombre', 150),
  email: emailSchema,
  password: passwordSchema,
  aceptaTerminos: z.literal(true, { error: 'Debes aceptar los términos para crear la cuenta' }),
});

export type CrearInvitacionInput = z.infer<typeof crearInvitacionSchema>;
export type RegistroInvitacionInput = z.infer<typeof registroInvitacionSchema>;
