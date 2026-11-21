import { isAxiosError } from 'axios';
import { http } from '@/lib/http';
import type { ApiResponse, PeriodoReporte, Reporte } from '@/types';

/**
 * Cuando se pide un archivo, un error de la API también llega como archivo. Se lee como JSON
 * para que `parseApiError` encuentre el mensaje.
 */
async function leerErrorDeArchivo(error: unknown): Promise<never> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      // No era JSON: queda el mensaje general
    }
  }
  throw error;
}

/** HU-71 y HU-72 · Llamadas a /api/reportes (solo admin) */
export const reportesApi = {
  ver: (periodo: PeriodoReporte) =>
    http.get<ApiResponse<Reporte>>('/reportes', { params: { periodo } }).then((r) => r.data.data),

  /** CSV de las órdenes del periodo (UTF-8 con BOM, separado por «;») */
  exportar: (periodo: PeriodoReporte, fecha: string) =>
    http
      .get<Blob>('/reportes/ordenes', { params: { periodo, fecha }, responseType: 'blob' })
      .then((r) => r.data, leerErrorDeArchivo),
};
