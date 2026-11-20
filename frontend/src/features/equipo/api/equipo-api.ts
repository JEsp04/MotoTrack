import { http } from '@/lib/http';
import type { ApiResponse, ClaveRestablecida, EstadoRegistro, Integrante } from '@/types';

export interface NuevoMecanicoBody {
  nombre: string;
  email: string;
  telefono?: string;
  /** Contraseña temporal que el admin le entrega al mecánico */
  password: string;
}

/** HU-87 · Lo que el admin corrige de alguien del equipo */
export interface ActualizarIntegranteBody {
  nombre?: string;
  telefono?: string | null;
  rol?: Integrante['rol'];
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

  actualizar: (publicId: string, body: ActualizarIntegranteBody) =>
    http.patch<ApiResponse<Integrante>>(`/usuarios/${publicId}`, body).then((r) => r.data.data),

  /** HU-86 · Clave temporal para un integrante del equipo */
  restablecerClave: (publicId: string) =>
    http
      .post<ApiResponse<ClaveRestablecida>>(`/usuarios/${publicId}/reset-password`)
      .then((r) => r.data.data),
};
