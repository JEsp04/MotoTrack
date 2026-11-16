import { z } from 'zod';
import {
  busquedaSchema,
  paginacionSchema,
  texto,
  textoEditable,
  textoOpcional,
} from '../../utils/schemas.js';

/** Categorías del prototipo (enum CategoriaRepuesto de schema.prisma) */
export const CATEGORIAS = [
  'aceites',
  'frenos',
  'filtros',
  'transmision',
  'electrico',
  'llantas',
  'otros',
] as const;

const categoriaSchema = z.enum(CATEGORIAS, { error: 'Elige una categoría de la lista' });

/** Pesos enteros, sin decimales */
const pesos = (campo: string) =>
  z
    .number({ error: `${campo} debe ser un número` })
    .int(`${campo} debe ser en pesos, sin decimales`)
    .min(0, `${campo} no puede ser negativo`)
    .max(100_000_000, `Revisa ${campo.toLowerCase()}`);

const unidades = (campo: string) =>
  z
    .number({ error: `${campo} debe ser un número` })
    .int(`${campo} debe ser un número entero`)
    .min(0, `${campo} no puede ser negativo`)
    .max(100_000, `Revisa ${campo.toLowerCase()}`);

const precioVentaSchema = pesos('El precio de venta').min(1, 'El precio de venta es obligatorio');
const costoSchema = pesos('El costo')
  .nullish()
  .transform((v) => v ?? null);

/** POST /api/repuestos (HU-52). El stock inicial queda como un movimiento de entrada. */
export const crearRepuestoSchema = z.object({
  nombre: texto('El nombre', 150),
  referencia: textoOpcional('La referencia', 80),
  categoria: categoriaSchema.default('otros'),
  precioVenta: precioVentaSchema,
  costo: costoSchema,
  stock: unidades('El stock inicial').default(0),
  stockMinimo: unidades('El stock mínimo').min(1, 'El stock mínimo debe ser al menos 1').default(1),
  proveedor: textoOpcional('El proveedor', 150),
  motosCompatibles: textoOpcional('Las motos compatibles', 255),
});

/** PATCH /api/repuestos/:id (HU-52). El stock no se edita aquí: se usa un movimiento (HU-53). */
export const actualizarRepuestoSchema = z
  .object({
    nombre: texto('El nombre', 150).optional(),
    referencia: textoEditable('La referencia', 80),
    categoria: categoriaSchema.optional(),
    precioVenta: precioVentaSchema.optional(),
    costo: z.union([z.null(), pesos('El costo')]).optional(),
    stockMinimo: unidades('El stock mínimo')
      .min(1, 'El stock mínimo debe ser al menos 1')
      .optional(),
    proveedor: textoEditable('El proveedor', 150),
    motosCompatibles: textoEditable('Las motos compatibles', 255),
    activo: z.boolean({ error: 'Activo debe ser verdadero o falso' }).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

/** ?critico=true · ?activo=false. Sin valor, el filtro no se aplica. */
const booleanoQuery = z
  .enum(['true', 'false'], { error: 'Usa true o false' })
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

/**
 * GET /api/repuestos?q=&categoria=&critico=&activo=&page=&limit=
 * q busca en nombre, referencia y motos compatibles. Por defecto solo los activos.
 */
export const listarRepuestosSchema = paginacionSchema.extend({
  q: busquedaSchema,
  categoria: categoriaSchema.optional(),
  critico: booleanoQuery,
  activo: booleanoQuery.transform((v) => v ?? true),
});

/**
 * POST /api/repuestos/:id/movimientos (HU-53).
 * Entrada y salida: unidades que entran o salen. Ajuste: el stock que quedó en el conteo.
 */
export const registrarMovimientoSchema = z
  .object({
    tipo: z.enum(['entrada', 'salida', 'ajuste'], {
      error: 'El tipo debe ser entrada, salida o ajuste',
    }),
    cantidad: unidades('La cantidad'),
    referencia: textoOpcional('La referencia', 150),
  })
  .refine((d) => d.tipo === 'ajuste' || d.cantidad > 0, {
    path: ['cantidad'],
    message: 'La cantidad debe ser al menos 1',
  });

export type CrearRepuestoInput = z.infer<typeof crearRepuestoSchema>;
export type ActualizarRepuestoInput = z.infer<typeof actualizarRepuestoSchema>;
export type ListarRepuestosQuery = z.infer<typeof listarRepuestosSchema>;
export type RegistrarMovimientoInput = z.infer<typeof registrarMovimientoSchema>;
