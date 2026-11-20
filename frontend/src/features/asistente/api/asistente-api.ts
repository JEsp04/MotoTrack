import { http } from '@/lib/http';
import type { ApiResponse, EstadoAsistente, MensajeAsistente, RespuestaAsistente } from '@/types';

export interface ConsultarBody {
  mensajes: MensajeAsistente[];
  /** publicId de la moto, para que use su historial */
  motoId?: string;
}

/** HU-79 · Llamadas a /api/asistente. El frontend nunca habla directo con el modelo. */
export const asistenteApi = {
  estado: () => http.get<ApiResponse<EstadoAsistente>>('/asistente').then((r) => r.data.data),

  consultar: (body: ConsultarBody) =>
    http
      .post<ApiResponse<RespuestaAsistente>>('/asistente/consultas', body)
      .then((r) => r.data.data),
};
