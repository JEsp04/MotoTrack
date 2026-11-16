import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EstadoRegistro } from '@/types';
import { equipoApi, type NuevoMecanicoBody } from '../api/equipo-api';

const CLAVE = ['equipo'] as const;

export function useEquipo() {
  return useQuery({ queryKey: CLAVE, queryFn: equipoApi.listar });
}

export function useCrearMecanico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NuevoMecanicoBody) => equipoApi.crearMecanico(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useCambiarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, estado }: { publicId: string; estado: EstadoRegistro }) =>
      equipoApi.cambiarEstado(publicId, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
