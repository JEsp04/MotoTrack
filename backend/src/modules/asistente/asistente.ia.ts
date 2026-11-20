import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import {
  respuestaModeloSchema,
  type MensajeChat,
  type RespuestaModelo,
} from './asistente.schemas.js';

/**
 * HU-79 · Única pieza que habla con la API de Claude. La llave vive solo en el backend
 * (ANTHROPIC_API_KEY). Las pruebas reemplazan `modeloIA.consultar` con vi.spyOn: nunca gastan.
 */
let cliente: Anthropic | null = null;

function obtenerCliente(apiKey: string) {
  cliente ??= new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 });
  return cliente;
}

export const NO_DISPONIBLE = 'El asistente no está disponible en este momento. Intenta más tarde.';

async function consultarModelo(sistema: string, mensajes: MensajeChat[]): Promise<RespuestaModelo> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, NO_DISPONIBLE);
  const anthropic = obtenerCliente(env.ANTHROPIC_API_KEY);

  try {
    const respuesta = await anthropic.messages.parse({
      model: env.ANTHROPIC_MODEL,
      // Respuestas cortas: el JSON del diagnóstico cabe de sobra y el costo queda acotado
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(respuestaModeloSchema) },
      system: sistema,
      messages: mensajes.map((m) => ({
        role: m.rol === 'usuario' ? ('user' as const) : ('assistant' as const),
        content: m.texto,
      })),
    });

    if (respuesta.stop_reason === 'refusal') {
      throw HttpError.badRequest(
        'El asistente no puede responder eso. Describe un síntoma de tu moto.',
      );
    }
    if (!respuesta.parsed_output) throw new HttpError(502, NO_DISPONIBLE);
    return respuesta.parsed_output;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new HttpError(503, 'El asistente está muy ocupado. Intenta en un minuto.');
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('[asistente] La llave de Anthropic no es válida (ANTHROPIC_API_KEY)');
      throw new HttpError(503, NO_DISPONIBLE);
    }
    console.error('[asistente] Falló la llamada al modelo:', error);
    throw new HttpError(502, NO_DISPONIBLE);
  }
}

/** Objeto para que las pruebas puedan simular el modelo sin llamar a la API (que cobra) */
export const modeloIA = { consultar: consultarModelo };
