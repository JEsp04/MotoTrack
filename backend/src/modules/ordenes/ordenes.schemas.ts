import { z } from 'zod';
import { busquedaSchema, paginacionSchema, textoOpcional } from '../../utils/schemas.js';
import { GRUPOS } from './estados.js';

const ESTADOS = [
  'registrada',
  'diagnosticada',
  'esperando_aprobacion',
  'aprobada',
  'en_reparacion',
  'pendiente_repuesto',
  'lista_entrega',
  'entregada',
  'cerrada',
  'cancelada',
] as const;

const textoLargo = (campo: string, min: number, max: number) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(
      min,
      min > 1 ? `${campo} debe tener al menos ${min} caracteres` : `${campo} es obligatorio`,
    )
    .max(max, `${campo} admite máximo ${max} caracteres`);

/** POST /api/ordenes (HU-29) */
export const crearOrdenSchema = z.object({
  motoPublicId: z.uuid({ error: 'Elige la moto' }),
  mecanicoPublicId: z.uuid({ error: 'Elige el mecánico' }),
  motivoIngreso: textoLargo('El motivo de ingreso', 5, 2000),
  kilometrajeIngreso: z
    .number({ error: 'El kilometraje es obligatorio' })
    .int('El kilometraje debe ser un número entero')
    .min(0, 'El kilometraje no puede ser negativo')
    .max(2_000_000, 'Revisa el kilometraje'),
  observaciones: textoOpcional('Las observaciones', 2000),
});

/** GET /api/ordenes (HU-30) */
export const listarOrdenesSchema = paginacionSchema.extend({
  estado: z.enum(ESTADOS, { error: 'Estado no válido' }).optional(),
  grupo: z
    .enum(Object.keys(GRUPOS) as [keyof typeof GRUPOS, ...(keyof typeof GRUPOS)[]], {
      error: 'Filtro no válido',
    })
    .optional(),
  /** Placa, número de orden o nombre del cliente */
  q: busquedaSchema,
});

/** PATCH /api/ordenes/:id/estado (HU-28) */
export const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS, { error: 'Estado no válido' }),
  observacion: z
    .string()
    .trim()
    .max(1000, 'La observación admite máximo 1000 caracteres')
    .optional()
    .transform((v) => v || undefined),
});

/** POST /api/ordenes/:id/diagnostico (HU-32) */
export const diagnosticoSchema = z.object({
  hallazgos: textoLargo('Los hallazgos', 10, 5000),
  trabajoRecomendado: textoLargo('El trabajo recomendado', 5, 5000),
  prioridad: z
    .enum(['normal', 'urgente'], { error: 'La prioridad debe ser normal o urgente' })
    .default('normal'),
});

/** POST /api/ordenes/:id/servicios (HU-33). Precio en pesos enteros. */
export const agregarServicioSchema = z.object({
  servicioPublicId: z.uuid({ error: 'Elige el servicio' }),
  cantidad: z
    .number({ error: 'La cantidad debe ser un número' })
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(99, 'La cantidad máxima es 99')
    .default(1),
  /** Si no se envía, se usa el precio del catálogo */
  precioUnitario: z
    .number({ error: 'El precio debe ser un número' })
    .int('El precio va en pesos, sin decimales')
    .min(0, 'El precio no puede ser negativo')
    .max(100_000_000, 'Revisa el precio')
    .optional(),
});

export type CrearOrdenInput = z.infer<typeof crearOrdenSchema>;
export type ListarOrdenesQuery = z.infer<typeof listarOrdenesSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type DiagnosticoInput = z.infer<typeof diagnosticoSchema>;
export type AgregarServicioInput = z.infer<typeof agregarServicioSchema>;
