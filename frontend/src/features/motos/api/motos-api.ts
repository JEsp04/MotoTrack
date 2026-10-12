import { http } from '@/lib/http';
import type { ApiList, ApiResponse, Moto } from '@/types';

export interface MotoBody {
  placa: string;
  marca: string;
  referencia: string;
  /** Año del modelo */
  modelo: number;
  cilindraje: number | null;
  color: string | null;
  kilometraje: number;
}

export interface FiltroMotos {
  /** publicId del cliente (admin y mecánico) */
  cliente?: string;
  q?: string;
  page?: number;
}

/** Llamadas a /api/motos (HU-26, HU-27). Para el cliente, el backend devuelve solo las suyas. */
export const motosApi = {
  listar: (filtro: FiltroMotos = {}) =>
    http.get<ApiList<Moto>>('/motos', { params: { limit: 50, ...filtro } }).then((r) => r.data),

  /** El admin indica el cliente; para el cliente se ignora (queda a su nombre). */
  crear: (body: MotoBody & { clientePublicId?: string }) =>
    http.post<ApiResponse<Moto>>('/motos', body).then((r) => r.data.data),

  actualizar: (publicId: string, body: Partial<MotoBody>) =>
    http.patch<ApiResponse<Moto>>(`/motos/${publicId}`, body).then((r) => r.data.data),
};
