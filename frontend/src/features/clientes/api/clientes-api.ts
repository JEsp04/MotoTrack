import { http } from '@/lib/http';
import type { ApiList, ApiResponse, ClienteDetalle, ClienteResumen } from '@/types';

export interface NuevoClienteBody {
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

export type EditarClienteBody = Partial<Omit<NuevoClienteBody, 'documentoIdentidad'>>;

export const POR_PAGINA = 20;

/** Llamadas a /api/clientes (HU-24, HU-25). */
export const clientesApi = {
  /** q busca en nombre, documento, teléfono y placa */
  listar: ({ q, page }: { q?: string; page: number }) =>
    http
      .get<ApiList<ClienteResumen>>('/clientes', {
        params: { q: q || undefined, page, limit: POR_PAGINA },
      })
      .then((r) => r.data),

  obtener: (publicId: string) =>
    http.get<ApiResponse<ClienteDetalle>>(`/clientes/${publicId}`).then((r) => r.data.data),

  crear: (body: NuevoClienteBody) =>
    http.post<ApiResponse<ClienteResumen>>('/clientes', body).then((r) => r.data.data),

  actualizar: (publicId: string, body: EditarClienteBody) =>
    http.patch<ApiResponse<ClienteResumen>>(`/clientes/${publicId}`, body).then((r) => r.data.data),
};
