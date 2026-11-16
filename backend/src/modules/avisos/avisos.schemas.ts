import { z } from 'zod';
import { paginacionSchema } from '../../utils/schemas.js';

/** GET /api/avisos?noLeidos=true&page=&limit= */
export const listarAvisosSchema = paginacionSchema.extend({
  noLeidos: z
    .enum(['true', 'false'], { error: 'noLeidos debe ser true o false' })
    .optional()
    .transform((v) => v === 'true'),
});

export type ListarAvisosQuery = z.infer<typeof listarAvisosSchema>;
