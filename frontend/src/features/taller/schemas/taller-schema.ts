import { z } from 'zod';
import { emailOpcional, LIMITES, maximo, obligatorio, telefono } from '@/lib/validaciones';

/** Ejemplo de horario que entiende la agenda de citas (HU-57) */
export const EJEMPLO_HORARIO = 'Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00';

/**
 * HU-73 · Mismas reglas del backend. El backend además revisa que el horario se entienda,
 * porque las citas lo usan para calcular las horas libres.
 */
export const datosTallerSchema = z.object({
  nombre: obligatorio('El nombre del taller').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  nit: z
    .string()
    .trim()
    .max(LIMITES.nit, maximo(LIMITES.nit))
    .regex(/^[0-9-]*$/, 'El NIT solo admite números y guion'),
  direccion: z.string().trim().max(LIMITES.direccion, maximo(LIMITES.direccion)),
  telefono,
  email: emailOpcional,
  horarioAtencion: z.string().trim().max(LIMITES.horario, maximo(LIMITES.horario)),
});

export type DatosTallerValues = z.infer<typeof datosTallerSchema>;
