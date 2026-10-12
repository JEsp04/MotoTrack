import { z } from 'zod';
import { busquedaSchema, paginacionSchema, texto, textoEditable } from '../../utils/schemas.js';

/** Año máximo permitido: el próximo año (las motos nuevas salen con modelo del año siguiente) */
export const anioMaximo = () => new Date().getFullYear() + 1;

/**
 * Placa colombiana de moto: 3 letras, 2 números y 1 letra (ABC12D), o la antigua de
 * 3 letras y 2 números (ABC12). Se guarda en mayúsculas, sin espacios ni guiones.
 */
export const placaSchema = z
  .string({ error: 'La placa es obligatoria' })
  .max(10, 'La placa admite máximo 10 caracteres')
  .transform((v) => v.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{3}\d{2}[A-Z]?$/, 'Escribe una placa válida, por ejemplo ABC12D'));

const modeloSchema = z
  .number({ error: 'El modelo (año) es obligatorio' })
  .int('El modelo debe ser un año, por ejemplo 2022')
  .min(1950, 'El modelo debe ser desde 1950')
  .refine((v) => v <= anioMaximo(), {
    error: () => `El modelo no puede ser mayor a ${anioMaximo()}`,
  });

const cilindrajeSchema = z
  .number({ error: 'El cilindraje debe ser un número' })
  .int('El cilindraje debe ser un número entero')
  .min(50, 'El cilindraje debe ser de al menos 50 cc')
  .max(3000, 'El cilindraje admite máximo 3000 cc')
  .nullish()
  .transform((v) => v ?? null);

const kilometrajeSchema = z
  .number({ error: 'El kilometraje debe ser un número' })
  .int('El kilometraje debe ser un número entero')
  .min(0, 'El kilometraje no puede ser negativo')
  .max(2_000_000, 'Revisa el kilometraje');

const datosMoto = {
  placa: placaSchema,
  marca: texto('La marca', 80),
  referencia: texto('La referencia', 80),
  modelo: modeloSchema,
  cilindraje: cilindrajeSchema,
  color: textoEditable('El color', 40).transform((v) => v ?? null),
  kilometraje: kilometrajeSchema.default(0),
};

/**
 * POST /api/motos (HU-26).
 * El admin indica el cliente con clientePublicId. Para un cliente se ignora: la moto queda a su nombre.
 */
export const crearMotoSchema = z.object({
  clientePublicId: z.uuid({ error: 'Elige el cliente' }).optional(),
  ...datosMoto,
});

/** PATCH /api/motos/:id */
export const actualizarMotoSchema = z
  .object({
    placa: placaSchema.optional(),
    marca: texto('La marca', 80).optional(),
    referencia: texto('La referencia', 80).optional(),
    modelo: modeloSchema.optional(),
    cilindraje: cilindrajeSchema.optional(),
    color: textoEditable('El color', 40),
    kilometraje: kilometrajeSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

/** GET /api/motos?cliente=&q=&page=&limit= */
export const listarMotosSchema = paginacionSchema.extend({
  /** publicId del cliente (solo admin y mecánico) */
  cliente: z.string().optional(),
  q: busquedaSchema,
});

export type CrearMotoInput = z.infer<typeof crearMotoSchema>;
export type ActualizarMotoInput = z.infer<typeof actualizarMotoSchema>;
export type ListarMotosQuery = z.infer<typeof listarMotosSchema>;
