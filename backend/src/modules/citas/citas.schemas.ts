import { z } from 'zod';
import { texto, textoEditable, textoOpcional } from '../../utils/schemas.js';

export const ESTADOS_CITA = ['programada', 'confirmada', 'atendida', 'cancelada'] as const;

const estadoSchema = z.enum(ESTADOS_CITA, {
  error: 'El estado debe ser programada, confirmada, atendida o cancelada',
});

/** Día en formato AAAA-MM-DD (se entiende en hora de Colombia) */
const diaSchema = (campo: string) =>
  z
    .string({ error: `${campo} es obligatoria` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${campo} debe tener el formato AAAA-MM-DD`)
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), `${campo} no es válida`);

/**
 * Día y hora con zona horaria, por ejemplo 2026-11-03T09:00:00-05:00 o 2026-11-03T14:00:00Z.
 * Se guarda en UTC.
 */
const fechaHoraSchema = z
  .string({ error: 'La fecha y hora son obligatorias' })
  .pipe(
    z.iso.datetime({
      offset: true,
      error: 'Escribe la fecha y hora con zona horaria, por ejemplo 2026-11-03T09:00:00-05:00',
    }),
  )
  .transform((v) => new Date(v));

const motivoSchema = texto('El motivo', 150);

/** GET /api/citas?desde=&hasta=&estado=&page=&limit= (HU-57). Por defecto 50 por página. */
export const listarCitasSchema = z
  .object({
    desde: diaSchema('La fecha desde').optional(),
    hasta: diaSchema('La fecha hasta').optional(),
    estado: estadoSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((q) => !q.desde || !q.hasta || q.desde <= q.hasta, {
    path: ['hasta'],
    message: 'La fecha hasta debe ser igual o posterior a la fecha desde',
  });

/** GET /api/citas/horas-libres?fecha=AAAA-MM-DD (HU-57) */
export const horasLibresSchema = z.object({ fecha: diaSchema('La fecha') });

/**
 * POST /api/citas (HU-57).
 * El admin agenda para cualquier moto del taller; el cliente, solo para las suyas.
 */
export const crearCitaSchema = z.object({
  motoPublicId: z.string({ error: 'Elige la moto' }).min(1, 'Elige la moto'),
  fechaHora: fechaHoraSchema,
  motivo: motivoSchema,
  detalle: textoOpcional('El detalle', 500),
  recordatorio: z.boolean({ error: 'Recordatorio debe ser verdadero o falso' }).default(false),
});

/**
 * PATCH /api/citas/:id (HU-57): reprogramar (fechaHora), cambiar el estado o corregir datos.
 * Una cita atendida o cancelada ya no cambia.
 */
export const actualizarCitaSchema = z
  .object({
    fechaHora: fechaHoraSchema.optional(),
    estado: estadoSchema.optional(),
    motivo: motivoSchema.optional(),
    detalle: textoEditable('El detalle', 500),
    recordatorio: z.boolean({ error: 'Recordatorio debe ser verdadero o falso' }).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

export type ListarCitasQuery = z.infer<typeof listarCitasSchema>;
export type CrearCitaInput = z.infer<typeof crearCitaSchema>;
export type ActualizarCitaInput = z.infer<typeof actualizarCitaSchema>;
