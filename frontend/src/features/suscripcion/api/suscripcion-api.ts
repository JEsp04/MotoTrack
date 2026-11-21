import { http } from '@/lib/http';
import type { ApiResponse, EstadoSuscripcion, PlanTaller, ResultadoPago } from '@/types';

export interface DatosTarjeta {
  numero: string;
  nombre: string;
  vence: string;
  cvv: string;
}

export type SolicitudPago =
  | { tipo: 'plan'; plan: PlanTaller; tarjeta: DatosTarjeta; autorizaCobroAutomatico: true }
  | { tipo: 'metodo'; tarjeta: DatosTarjeta };

/** HU-80/81 · Llamadas a /api/suscripcion y a la pasarela simulada (solo admin) */
export const suscripcionApi = {
  obtener: () => http.get<ApiResponse<EstadoSuscripcion>>('/suscripcion').then((r) => r.data.data),

  /** La pasarela valida la tarjeta y devuelve el resultado firmado */
  pagar: (solicitud: SolicitudPago) =>
    http
      .post<ApiResponse<{ resultado: ResultadoPago; token: string }>>(
        '/pasarela/transacciones',
        solicitud,
      )
      .then((r) => r.data.data),

  /** El backend verifica la firma de la pasarela y aplica el pago */
  confirmar: (token: string) =>
    http
      .post<ApiResponse<EstadoSuscripcion>>('/suscripcion/pagos', { token })
      .then((r) => r.data.data),
};
