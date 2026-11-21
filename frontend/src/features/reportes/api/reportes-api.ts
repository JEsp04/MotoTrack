import { http } from '@/lib/http';
import type { ApiResponse, PeriodoReporte, Reporte } from '@/types';

/** HU-71 · Llamadas a /api/reportes (solo admin) */
export const reportesApi = {
  ver: (periodo: PeriodoReporte) =>
    http.get<ApiResponse<Reporte>>('/reportes', { params: { periodo } }).then((r) => r.data.data),
};
