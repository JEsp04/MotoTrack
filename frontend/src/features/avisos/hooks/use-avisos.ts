import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AvisosLista } from '@/types';
import { avisosApi } from '../api/avisos-api';

/** Cada cuánto se preguntan los avisos nuevos (sin servicios pagos de notificaciones) */
export const CADA_MINUTO = 60_000;

/** HU-70 · Lista de avisos, con el filtro «Sin leer». Se actualiza cada 60 s. */
export function useAvisos(soloNoLeidos: boolean) {
  return useQuery({
    queryKey: ['avisos', 'lista', soloNoLeidos],
    queryFn: () => avisosApi.listar({ noLeidos: soloNoLeidos }),
    refetchInterval: CADA_MINUTO,
    placeholderData: keepPreviousData,
  });
}

/** Cuántos avisos sin leer tiene el usuario (para la campana). Se actualiza cada 60 s. */
export function useAvisosNoLeidos() {
  return useQuery({
    queryKey: ['avisos', 'no-leidos'],
    queryFn: async () => (await avisosApi.listar({ noLeidos: true, limit: 1 })).meta.noLeidos,
    refetchInterval: CADA_MINUTO,
  });
}

/** Marca un aviso como leído: lo cambia en la lista al instante y baja el contador. */
export function useMarcarLeido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => avisosApi.marcarLeido(publicId),
    onMutate: (publicId: string) => {
      qc.setQueriesData<AvisosLista>({ queryKey: ['avisos', 'lista'] }, (lista) =>
        lista
          ? {
              ...lista,
              data: lista.data.map((a) => (a.publicId === publicId ? { ...a, leido: true } : a)),
              meta: { ...lista.meta, noLeidos: Math.max(0, lista.meta.noLeidos - 1) },
            }
          : lista,
      );
      qc.setQueryData<number>(['avisos', 'no-leidos'], (n) => (n ? n - 1 : n));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['avisos'] }),
  });
}
