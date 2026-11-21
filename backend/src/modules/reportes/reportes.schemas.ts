import { z } from 'zod';

/** GET /api/reportes?periodo=semana|mes&fecha=AAAA-MM-DD */
export const reporteSchema = z.object({
  periodo: z.enum(['semana', 'mes'], { error: 'El periodo debe ser semana o mes' }).default('mes'),
  /** Un día dentro del periodo que se quiere ver. Sin él, hoy. */
  fecha: z
    .string()
    .max(10, 'La fecha debe tener el formato AAAA-MM-DD')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'La fecha no es válida')
    .optional(),
});

export type ReporteQuery = z.infer<typeof reporteSchema>;
