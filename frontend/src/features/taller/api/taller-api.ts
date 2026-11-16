import { http } from '@/lib/http';
import type { ApiResponse, DatosTaller } from '@/types';

/** Lo que se puede cambiar. '' borra los campos opcionales. */
export interface ActualizarTallerBody {
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  horarioAtencion: string;
}

/** Llamadas a /api/talleres/mio (HU-73). Cambiar los datos es solo del admin. */
export const tallerApi = {
  obtener: () => http.get<ApiResponse<DatosTaller>>('/talleres/mio').then((r) => r.data.data),

  actualizar: (body: ActualizarTallerBody) =>
    http.patch<ApiResponse<DatosTaller>>('/talleres/mio', body).then((r) => r.data.data),
};
