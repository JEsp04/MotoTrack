import { z } from 'zod';

export const planSchema = z.enum(['basico', 'inteligente'], {
  error: 'Elige el plan Básico o el Inteligente',
});

/** PATCH /api/suscripcion/plan */
export const cambiarPlanSchema = z.object({ plan: planSchema });

export type CambiarPlanInput = z.infer<typeof cambiarPlanSchema>;
