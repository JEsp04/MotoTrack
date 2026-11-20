import { http } from '@/lib/http';
import type { ApiList, ApiResponse, Cita, EstadoCita, HorasLibres } from '@/types';

export interface CrearCitaBody {
  motoPublicId: string;
  /** Fecha y hora con zona horaria (la que devuelve horas-libres, en UTC) */
  fechaHora: string;
  motivo: string;
  detalle?: string;
  recordatorio: boolean;
}

export interface FiltroCitas {
  /** Día «AAAA-MM-DD» */
  desde?: string;
  hasta?: string;
  estado?: EstadoCita;
}

/** Llamadas a /api/citas (HU-57). Para el cliente, el backend devuelve solo las suyas. */
export const citasApi = {
  listar: (filtro: FiltroCitas = {}) =>
    http.get<ApiList<Cita>>('/citas', { params: { limit: 100, ...filtro } }).then((r) => r.data),

  obtener: (publicId: string) =>
    http.get<ApiResponse<Cita>>(`/citas/${publicId}`).then((r) => r.data.data),

  horasLibres: (fecha: string) =>
    http
      .get<ApiResponse<HorasLibres>>('/citas/horas-libres', { params: { fecha } })
      .then((r) => r.data.data),

  crear: (body: CrearCitaBody) =>
    http.post<ApiResponse<Cita>>('/citas', body).then((r) => r.data.data),
};
