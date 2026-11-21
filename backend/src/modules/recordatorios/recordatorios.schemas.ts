import { z } from 'zod';
import { MOTIVOS_RECHAZO } from './recordatorios.reglas.js';

/** GET /api/recordatorios?estado=pendiente|revisados */
export const listarRecordatoriosSchema = z.object({
  estado: z
    .enum(['pendiente', 'revisados'], { error: 'El estado debe ser pendiente o revisados' })
    .default('pendiente'),
});

/** POST /api/recordatorios/:id/rechazar */
export const rechazarSchema = z.object({
  motivo: z.enum(MOTIVOS_RECHAZO, { error: 'Elige por qué rechazas el recordatorio' }),
});

export type ListarRecordatoriosQuery = z.infer<typeof listarRecordatoriosSchema>;
export type RechazarInput = z.infer<typeof rechazarSchema>;
