import { http } from '@/lib/http';
import type { ApiResponse, EstadoResena, ResenaAdmin, ResenasLista } from '@/types';

export const POR_PAGINA = 20;

export interface ListarResenasParams {
  calificacion?: number;
  estado?: EstadoResena;
  page?: number;
  limit?: number;
}

export interface ActualizarResenaBody {
  respuestaAdmin?: string | null;
  estado?: EstadoResena;
}

/** HU-89 · Llamadas a /api/resenas (solo admin) */
export const resenasApi = {
  listar: ({ calificacion, estado, page = 1, limit = POR_PAGINA }: ListarResenasParams = {}) =>
    http
      .get<ResenasLista>('/resenas', { params: { calificacion, estado, page, limit } })
      .then((r) => r.data),

  actualizar: (publicId: string, body: ActualizarResenaBody) =>
    http.patch<ApiResponse<ResenaAdmin>>(`/resenas/${publicId}`, body).then((r) => r.data.data),
};
