import { http } from '@/lib/http';
import type { ApiResponse, Aviso, AvisosLista } from '@/types';

export const POR_PAGINA = 50;

export interface ListarAvisosParams {
  noLeidos?: boolean;
  page?: number;
  limit?: number;
}

/** HU-70 · Llamadas a /api/avisos (los avisos del usuario de la sesión, HU-69) */
export const avisosApi = {
  listar: ({ noLeidos, page = 1, limit = POR_PAGINA }: ListarAvisosParams = {}) =>
    http
      .get<AvisosLista>('/avisos', {
        params: { noLeidos: noLeidos ? 'true' : undefined, page, limit },
      })
      .then((r) => r.data),

  marcarLeido: (publicId: string) =>
    http.patch<ApiResponse<Aviso>>(`/avisos/${publicId}/leido`).then((r) => r.data.data),

  leerTodos: () =>
    http.post<ApiResponse<{ actualizados: number }>>('/avisos/leer-todos').then((r) => r.data.data),
};
