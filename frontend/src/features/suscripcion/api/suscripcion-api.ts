import { http } from '@/lib/http';
import type { ApiResponse, EstadoSuscripcion, PlanTaller } from '@/types';

/** HU-80 · Llamadas a /api/suscripcion (solo admin) */
export const suscripcionApi = {
  obtener: () => http.get<ApiResponse<EstadoSuscripcion>>('/suscripcion').then((r) => r.data.data),

  cambiarPlan: (plan: PlanTaller) =>
    http
      .patch<ApiResponse<EstadoSuscripcion>>('/suscripcion/plan', { plan })
      .then((r) => r.data.data),
};
