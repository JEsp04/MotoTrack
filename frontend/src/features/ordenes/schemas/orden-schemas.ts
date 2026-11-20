import { z } from 'zod';
import { enteroDesdeTexto } from '@/lib/validaciones';

/** «Los hallazgos deben…» / «El motivo debe…» (HU-85: concordancia en plural) */
const textoLargo = (campo: string, min: number, max: number) => {
  const plural = /^(los|las)\s/i.test(campo);
  const obligatorio = `${campo} ${plural ? 'son obligatorios' : 'es obligatorio'}`;
  return z
    .string()
    .trim()
    .min(
      min,
      min > 1 ? `${campo} debe${plural ? 'n' : ''} tener al menos ${min} caracteres` : obligatorio,
    )
    .max(max, `Máximo ${max} caracteres`);
};

/** HU-32 · Mismas reglas del backend */
export const diagnosticoSchema = z.object({
  hallazgos: textoLargo('Los hallazgos', 10, 5000),
  trabajoRecomendado: textoLargo('El trabajo recomendado', 5, 5000),
  prioridad: z.enum(['normal', 'urgente']),
});
export type DiagnosticoForm = z.infer<typeof diagnosticoSchema>;

/** HU-33, HU-56 · Precio en pesos enteros; vacío = el del catálogo o repuesto */
export const servicioSchema = z.object({
  cantidad: enteroDesdeTexto('Escribe solo números')
    .refine((v) => v === undefined || (v >= 1 && v <= 99), 'Entre 1 y 99')
    .transform((v) => v ?? 1),
  precioUnitario: enteroDesdeTexto('Escribe el precio en pesos, sin decimales').refine(
    (v) => v === undefined || v <= 100_000_000,
    'Revisa el precio',
  ),
});
export type ServicioFormValues = z.input<typeof servicioSchema>;
export type ServicioFormOutput = z.output<typeof servicioSchema>;

/** HU-29 · Datos de la orden (la moto se elige aparte) */
export const nuevaOrdenSchema = z.object({
  mecanicoPublicId: z.string().min(1, 'Elige el mecánico'),
  motivoIngreso: textoLargo('El motivo de ingreso', 5, 2000),
  kilometrajeIngreso: enteroDesdeTexto('Escribe solo números')
    .refine((v) => v !== undefined, 'El kilometraje es obligatorio')
    .refine((v) => v === undefined || v <= 2_000_000, 'Revisa el kilometraje')
    .transform((v) => v!),
  observaciones: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  /** HU-62 · Opcional. No puede ser antes de hoy (el día de ingreso) */
  fechaEstimadaEntrega: z
    .string()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Elige una fecha válida'),
});

/** HU-62 · Cambiar la fecha estimada (vacío = quitarla) */
export const entregaSchema = z.object({
  fechaEstimadaEntrega: z
    .string()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Elige una fecha válida'),
});
export type EntregaForm = z.infer<typeof entregaSchema>;
export type NuevaOrdenValues = z.input<typeof nuevaOrdenSchema>;
export type NuevaOrdenOutput = z.output<typeof nuevaOrdenSchema>;
