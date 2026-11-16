import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types';

export const MENSAJE_SIN_CONEXION = 'No pudimos conectar. Intenta de nuevo.';
export const MENSAJE_INESPERADO = 'Ocurrió un error inesperado. Intenta de nuevo.';

export interface ErrorDeApi {
  status: number | null;
  /** Mensaje general para mostrar en un aviso */
  message: string;
  /** Mensajes por campo, listos para mostrar debajo de cada input: { placa: 'Ya existe' } */
  fields: Record<string, string>;
}

/** Convierte cualquier error de una petición en { status, message, fields } (HU-12). */
export function parseApiError(error: unknown): ErrorDeApi {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return { status: null, message: MENSAJE_SIN_CONEXION, fields: {} };
    }
    const { status, data } = error.response;
    const fields: Record<string, string> = {};
    for (const e of data?.errors ?? []) {
      if (e.field && !fields[e.field]) fields[e.field] = e.message;
    }
    const message = status >= 500 ? MENSAJE_INESPERADO : (data?.message ?? MENSAJE_INESPERADO);
    return { status, message, fields };
  }
  return { status: null, message: MENSAJE_INESPERADO, fields: {} };
}
