import { z } from 'zod';
import { paginacionSchema, textoEditable, textoOpcional } from '../../utils/schemas.js';

/** HU-89 · Aspectos rápidos que el cliente puede destacar (también en el frontend) */
export const ASPECTOS = [
  'Buena atención',
  'Puntualidad',
  'Calidad del trabajo',
  'Precio justo',
  'Me explicaron todo',
  'Moto limpia',
] as const;

const calificacionSchema = z
  .number({ error: 'Elige de 1 a 5 estrellas' })
  .int('Elige de 1 a 5 estrellas')
  .min(1, 'Elige de 1 a 5 estrellas')
  .max(5, 'Elige de 1 a 5 estrellas');

/** POST /api/ordenes/:id/resena */
export const crearResenaSchema = z.object({
  calificacion: calificacionSchema,
  aspectos: z
    .array(z.enum(ASPECTOS, { error: 'Elige aspectos de la lista' }), {
      error: 'Elige aspectos de la lista',
    })
    .max(ASPECTOS.length)
    .default([])
    .transform((lista) => [...new Set(lista)]),
  comentario: textoOpcional('El comentario', 500),
});

const estadoResena = z.enum(['pendiente', 'revisada', 'adaptada'], {
  error: 'El estado debe ser pendiente, revisada o adaptada',
});

/** GET /api/resenas?calificacion=&estado=&page=&limit= */
export const listarResenasSchema = paginacionSchema.extend({
  calificacion: z.coerce
    .number({ error: 'La calificación debe ser de 1 a 5' })
    .int()
    .min(1, 'La calificación debe ser de 1 a 5')
    .max(5, 'La calificación debe ser de 1 a 5')
    .optional(),
  estado: estadoResena.optional(),
});

/** PATCH /api/resenas/:id · Respuesta del taller y seguimiento */
export const actualizarResenaSchema = z
  .object({
    respuestaAdmin: textoEditable('La respuesta', 500),
    estado: estadoResena.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

export type CrearResenaInput = z.infer<typeof crearResenaSchema>;
export type ListarResenasQuery = z.infer<typeof listarResenasSchema>;
export type ActualizarResenaInput = z.infer<typeof actualizarResenaSchema>;
