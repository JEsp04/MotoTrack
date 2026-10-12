import { http } from '@/lib/http';
import type { ApiResponse, EstadoRegistro, Integrante } from '@/types';

export interface NuevoMecanicoBody {
  nombre: string;
  email: string;
  telefono?: string;
  /** Contraseña temporal que el admin le entrega al mecánico */
  password: string;
}

/** Llamadas a /api/usuarios (HU-23). Solo el admin. */
export const equipoApi = {
  listar: () => http.get<ApiResponse<Integrante[]>>('/usuarios').then((r) => r.data.data),

  crearMecanico: (body: NuevoMecanicoBody) =>
    http.post<ApiResponse<Integrante>>('/usuarios', body).then((r) => r.data.data),

  cambiarEstado: (publicId: string, estado: EstadoRegistro) =>
    http
      .patch<ApiResponse<Integrante>>(`/usuarios/${publicId}`, { estado })
      .then((r) => r.data.data),
};
