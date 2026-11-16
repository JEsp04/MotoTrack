import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitacionesApi, type NuevaInvitacionBody } from '../api/invitaciones-api';

const CLAVE = ['invitaciones'] as const;

export function useInvitaciones() {
  return useQuery({ queryKey: CLAVE, queryFn: invitacionesApi.listar });
}

function useAccion<A>(fn: (arg: A) => ReturnType<typeof invitacionesApi.crear>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export const useCrearInvitacion = () =>
  useAccion((body: NuevaInvitacionBody) => invitacionesApi.crear(body));
export const useReenviarInvitacion = () =>
  useAccion((publicId: string) => invitacionesApi.reenviar(publicId));
export const useCancelarInvitacion = () =>
  useAccion((publicId: string) => invitacionesApi.cancelar(publicId));
