import { http } from '@/lib/http';
import type { ApiResponse, Recordatorio, RecordatoriosLista } from '@/types';

export type PestanaRecordatorios = 'pendiente' | 'revisados';

/** HU-75 · Llamadas a /api/recordatorios (solo admin) */
export const recordatoriosApi = {
  /** Calcula los que tocan y lista los pendientes o los ya revisados */
  listar: (estado: PestanaRecordatorios) =>
    http.get<RecordatoriosLista>('/recordatorios', { params: { estado } }).then((r) => r.data),

  aprobar: (publicId: string) =>
    http
      .post<ApiResponse<Recordatorio & { mensaje: string }>>(`/recordatorios/${publicId}/aprobar`)
      .then((r) => r.data.data),

  rechazar: (publicId: string, motivo: string) =>
    http
      .post<ApiResponse<Recordatorio>>(`/recordatorios/${publicId}/rechazar`, { motivo })
      .then((r) => r.data.data),
};
