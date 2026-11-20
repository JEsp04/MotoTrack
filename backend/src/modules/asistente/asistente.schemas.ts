import { z } from 'zod';

/** HU-79 · Síntomas rápidos que el chat ofrece como botones (también en el frontend) */
export const SINTOMAS = [
  'Ruido al frenar',
  'No enciende',
  'Ruido en la cadena',
  'Sale humo',
] as const;

/** Mensajes que se mandan al modelo: los últimos de la conversación, para no gastar de más */
export const MAX_MENSAJES = 12;
const MAX_TEXTO = 800;

const mensajeSchema = z.object({
  rol: z.enum(['usuario', 'asistente'], { error: 'El rol debe ser usuario o asistente' }),
  texto: z
    .string({ error: 'Escribe el mensaje' })
    .trim()
    .min(1, 'Escribe el mensaje')
    .max(MAX_TEXTO, `El mensaje admite máximo ${MAX_TEXTO} caracteres`),
});

/** POST /api/asistente/consultas */
export const consultarSchema = z.object({
  mensajes: z
    .array(mensajeSchema, { error: 'Envía la conversación' })
    .min(1, 'Escribe el síntoma')
    .max(40, 'La conversación es muy larga: empieza una nueva')
    .refine((lista) => lista.at(-1)?.rol === 'usuario', 'El último mensaje debe ser tuyo')
    .transform((lista) => lista.slice(-MAX_MENSAJES)),
  /** publicId de la moto, para que el asistente use su historial (opcional) */
  motoId: z.uuid('La moto no es válida').optional(),
});

export type ConsultarInput = z.infer<typeof consultarSchema>;
export type MensajeChat = ConsultarInput['mensajes'][number];

/**
 * Forma de la respuesta que se le pide al modelo (salida estructurada).
 * `tipo: 'pregunta'` cuando necesita un dato más; `'diagnostico'` cuando ya puede orientar.
 */
export const respuestaModeloSchema = z.object({
  tipo: z.enum(['pregunta', 'diagnostico']),
  /** Texto corto para la burbuja del chat */
  texto: z.string(),
  /** Hasta 4 respuestas rápidas para tocar */
  opciones: z.array(z.string()),
  diagnostico: z
    .object({
      titulo: z.string(),
      urgencia: z.enum(['alta', 'media', 'baja']),
      resumen: z.string(),
      causas: z.array(z.string()),
      pruebas: z.array(z.string()),
      costoEstimado: z.string(),
      consejo: z.string(),
      /** Motivo corto para pedir la cita o la orden, por ejemplo «Revisar frenos delanteros» */
      motivoCita: z.string(),
    })
    .nullable(),
});

export type RespuestaModelo = z.infer<typeof respuestaModeloSchema>;
