import { z } from 'zod';

export const planSchema = z.enum(['basico', 'inteligente'], {
  error: 'Elige el plan Básico o el Inteligente',
});

/** POST /api/suscripcion/pagos · El resultado firmado que devolvió la pasarela */
export const confirmarPagoSchema = z.object({
  token: z.string({ error: 'Falta la confirmación de la pasarela' }).min(1).max(2000),
});

export type ConfirmarPagoInput = z.infer<typeof confirmarPagoSchema>;
