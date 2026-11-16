import { z } from 'zod';
import { emailOpcional, LIMITES, maximo, obligatorio, telefono } from '@/lib/validaciones';

/** «Invitar usuario» (HU-67). Las mismas reglas del backend (invitaciones.schemas.ts). */
export const invitacionSchema = z.object({
  nombre: obligatorio('El nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  telefono,
  email: emailOpcional,
  rol: z.enum(['mecanico', 'admin']),
});
export type InvitacionValues = z.infer<typeof invitacionSchema>;
