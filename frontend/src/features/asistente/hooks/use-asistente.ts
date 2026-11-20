import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EstadoAsistente } from '@/types';
import { asistenteApi, type ConsultarBody } from '../api/asistente-api';

const CLAVE = ['asistente', 'estado'] as const;

/** Si el asistente está encendido y cuántas consultas quedan hoy */
export function useEstadoAsistente() {
  return useQuery({ queryKey: CLAVE, queryFn: asistenteApi.estado });
}

/** Cada respuesta trae el cupo actualizado: se guarda sin volver a pedir el estado */
export function useConsultarAsistente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsultarBody) => asistenteApi.consultar(body),
    onSuccess: ({ limite, usados, restantes }) =>
      qc.setQueryData<EstadoAsistente>(CLAVE, (prev) => ({
        disponible: prev?.disponible ?? true,
        limite,
        usados,
        restantes,
      })),
    // Si se acabó el cupo o falla, el estado del servidor manda
    onError: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
