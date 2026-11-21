import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlanTaller } from '@/types';
import { suscripcionApi } from '../api/suscripcion-api';

export const CLAVE_SUSCRIPCION = ['suscripcion'] as const;

export function useSuscripcion(activo = true) {
  return useQuery({
    queryKey: CLAVE_SUSCRIPCION,
    queryFn: suscripcionApi.obtener,
    enabled: activo,
  });
}

export function useCambiarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: PlanTaller) => suscripcionApi.cambiarPlan(plan),
    onSuccess: (datos) => qc.setQueryData(CLAVE_SUSCRIPCION, datos),
  });
}
