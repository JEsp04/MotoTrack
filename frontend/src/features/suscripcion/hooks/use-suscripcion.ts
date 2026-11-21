import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suscripcionApi, type SolicitudPago } from '../api/suscripcion-api';

export const CLAVE_SUSCRIPCION = ['suscripcion'] as const;

export function useSuscripcion(activo = true) {
  return useQuery({
    queryKey: CLAVE_SUSCRIPCION,
    queryFn: suscripcionApi.obtener,
    enabled: activo,
  });
}

/**
 * HU-81 · Paga con la pasarela simulada y, si la aprueba, confirma el pago en el backend.
 * Devuelve el resultado de la pasarela (aprobada o rechazada) para el comprobante.
 */
export function usePagar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (solicitud: SolicitudPago) => {
      const { resultado, token } = await suscripcionApi.pagar(solicitud);
      if (resultado.estado === 'aprobada') {
        qc.setQueryData(CLAVE_SUSCRIPCION, await suscripcionApi.confirmar(token));
      }
      return resultado;
    },
  });
}
