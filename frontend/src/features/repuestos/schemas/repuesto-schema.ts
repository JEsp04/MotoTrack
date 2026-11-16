import { z } from 'zod';
import { enteroDesdeTexto, LIMITES, maximo, obligatorio } from '@/lib/validaciones';
import type { CategoriaRepuesto } from '@/types';

const CATEGORIAS_ID = [
  'aceites',
  'frenos',
  'filtros',
  'transmision',
  'electrico',
  'llantas',
  'otros',
] as const satisfies readonly CategoriaRepuesto[];

/** Convierte un texto numérico con o sin puntos de miles ("28.000" → 28000) para vista previa. */
export function parseEnteroOpcional(texto: string): number | null {
  const limpio = texto.trim().replace(/\./g, '');
  if (!/^\d+$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Calcula el porcentaje entero de margen: (precio - costo) / precio * 100.
 * Devuelve null si falta el precio válido o el costo está vacío.
 */
export function calcularMargen(precioTexto: string, costoTexto: string): number | null {
  const precio = parseEnteroOpcional(precioTexto);
  const costo = parseEnteroOpcional(costoTexto);
  if (precio === null || precio <= 0 || costo === null) return null;
  return Math.round(((precio - costo) / precio) * 100);
}

/** HU-55 · Mismas reglas del backend (`backend/src/modules/repuestos/repuestos.schemas.ts`) */
export const nuevoRepuestoSchema = z.object({
  nombre: obligatorio('El nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  referencia: z.string().trim().max(LIMITES.referencia, maximo(LIMITES.referencia)),
  categoria: z.enum(CATEGORIAS_ID, { error: 'Elige una categoría de la lista' }),
  precioVenta: enteroDesdeTexto('Escribe el precio en pesos, sin decimales')
    .refine((v) => v !== undefined, 'El precio de venta es obligatorio')
    .refine((v) => v === undefined || v >= 1, 'El precio de venta debe ser mayor a cero')
    .refine((v) => v === undefined || v <= 100_000_000, 'Revisa el precio de venta')
    .transform((v) => v ?? 0),
  costo: enteroDesdeTexto('Escribe el costo en pesos, sin decimales').refine(
    (v) => v === undefined || v <= 100_000_000,
    'Revisa el costo',
  ),
  stock: z
    .number()
    .int('El stock inicial debe ser un número entero')
    .min(0, 'El stock inicial no puede ser negativo')
    .max(100_000, 'Revisa el stock inicial'),
  stockMinimo: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .min(1, 'El stock mínimo debe ser al menos 1')
    .max(100_000, 'Revisa el stock mínimo'),
  proveedor: z.string().trim().max(LIMITES.proveedor, maximo(LIMITES.proveedor)),
  motosCompatibles: z
    .string()
    .trim()
    .max(LIMITES.motosCompatibles, maximo(LIMITES.motosCompatibles)),
});

export type NuevoRepuestoValues = z.input<typeof nuevoRepuestoSchema>;
export type NuevoRepuestoOutput = z.output<typeof nuevoRepuestoSchema>;
