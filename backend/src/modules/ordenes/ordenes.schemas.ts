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

/** «Los hallazgos deben…» / «El motivo debe…» (HU-85: concordancia en plural) */
const textoLargo = (campo: string, min: number, max: number) => {
  const plural = /^(los|las)\s/i.test(campo);
  const obligatorio = `${campo} ${plural ? 'son obligatorios' : 'es obligatorio'}`;
  const n = plural ? 'n' : '';
  return z
    .string({ error: obligatorio })
    .trim()
    .min(min, min > 1 ? `${campo} debe${n} tener al menos ${min} caracteres` : obligatorio)
    .max(max, `${campo} admite${n} máximo ${max} caracteres`);
};

/** Código de retiro de 4 dígitos (HU-66) */
const codigoRetiro = z
  .string({ error: 'Escribe el código de retiro' })
  .trim()
  .regex(/^\d{4}$/, 'El código de retiro tiene 4 dígitos');
/** Día AAAA-MM-DD (fecha estimada de entrega, HU-62). Se valida contra el ingreso en el servicio. */
const diaEntrega = z
  .string({ error: 'Escribe la fecha estimada de entrega' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha estimada debe tener el formato AAAA-MM-DD')
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) &&
      new Date(`${v}T00:00:00Z`).toISOString().startsWith(v),
    'La fecha estimada no es válida',
  );

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
  /** HU-62 · Opcional al recibir la moto */
  fechaEstimadaEntrega: z
    .union([z.literal(''), z.null(), diaEntrega])
    .optional()
    .transform((v) => v || null),
});

/** PATCH /api/ordenes/:id/entrega (HU-62). null la borra. */
export const fechaEntregaSchema = z.object({
  fechaEstimadaEntrega: z.union([z.null(), diaEntrega], {
    error: 'Escribe la fecha estimada de entrega',
  }),
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

/** GET /api/ordenes/actividad (HU-85) */
export const actividadSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
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
  /** HU-66: obligatorio para pasar a entregada */
  codigo: codigoRetiro.optional(),
});

/** POST /api/ordenes/:id/retiro (HU-66) */
export const retiroSchema = z.object({
  codigo: codigoRetiro,
});

/** POST /api/ordenes/:id/diagnostico (HU-32) */
export const diagnosticoSchema = z.object({
  hallazgos: textoLargo('Los hallazgos', 10, 5000),
  trabajoRecomendado: textoLargo('El trabajo recomendado', 5, 5000),
  prioridad: z
    .enum(['normal', 'urgente'], { error: 'La prioridad debe ser normal o urgente' })
    .default('normal'),
});

/** POST /api/ordenes/:id/servicios (HU-33, HU-56). Precio en pesos enteros. */
export const agregarServicioSchema = z
  .object({
    servicioPublicId: z.uuid({ error: 'Elige el servicio' }).optional(),
    repuestoPublicId: z.uuid({ error: 'Elige el repuesto' }).optional(),
    cantidad: z
      .number({ error: 'La cantidad debe ser un número' })
      .int('La cantidad debe ser un número entero')
      .min(1, 'La cantidad mínima es 1')
      .max(99, 'La cantidad máxima es 99')
      .default(1),
    /** Si no se envía, se usa el precio del catálogo o del repuesto */
    precioUnitario: z
      .number({ error: 'El precio debe ser un número' })
      .int('El precio va en pesos, sin decimales')
      .min(0, 'El precio no puede ser negativo')
      .max(100_000_000, 'Revisa el precio')
      .optional(),
  })
  .refine((d) => Boolean(d.servicioPublicId) !== Boolean(d.repuestoPublicId), {
    message: 'Elige un servicio o un repuesto, no ambos',
  });

export type CrearOrdenInput = z.infer<typeof crearOrdenSchema>;
export type ListarOrdenesQuery = z.infer<typeof listarOrdenesSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type DiagnosticoInput = z.infer<typeof diagnosticoSchema>;
export type RetiroInput = z.infer<typeof retiroSchema>;
export type FechaEntregaInput = z.infer<typeof fechaEntregaSchema>;
export type AgregarServicioInput = z.infer<typeof agregarServicioSchema>;
