import { http } from '@/lib/http';
import type { ApiResponse, Invitacion, RolInvitado } from '@/types';

export interface NuevaInvitacionBody {
  nombre: string;
  telefono: string;
  email?: string;
  rol: RolInvitado;
}

/** Llamadas a /api/invitaciones (HU-67). Solo el admin. */
export const invitacionesApi = {
  listar: () => http.get<ApiResponse<Invitacion[]>>('/invitaciones').then((r) => r.data.data),

  crear: (body: NuevaInvitacionBody) =>
    http.post<ApiResponse<Invitacion>>('/invitaciones', body).then((r) => r.data.data),

  reenviar: (publicId: string) =>
    http
      .post<ApiResponse<Invitacion>>(`/invitaciones/${publicId}/reenviar`)
      .then((r) => r.data.data),

  cancelar: (publicId: string) =>
    http
      .post<ApiResponse<Invitacion>>(`/invitaciones/${publicId}/cancelar`)
      .then((r) => r.data.data),
};
