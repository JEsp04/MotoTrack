import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { EstadoResena } from '@/types';
import { resenasApi, type ActualizarResenaBody } from '../api/resenas-api';

export interface FiltroResenas {
  calificacion?: number;
  estado?: EstadoResena;
}

/** HU-89 · Reseñas del taller con filtro por estrellas o estado */
export function useResenas({ calificacion, estado }: FiltroResenas) {
  return useInfiniteQuery({
    queryKey: ['resenas', 'lista', calificacion ?? 0, estado ?? ''],
    queryFn: ({ pageParam }) => resenasApi.listar({ calificacion, estado, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

/** Promedio, total y pendientes del taller (para «Más», el panel y el encabezado) */
export function useResumenResenas(activo = true) {
  return useQuery({
    queryKey: ['resenas', 'resumen'],
    enabled: activo,
    queryFn: async () => {
      const { meta } = await resenasApi.listar({ page: 1, limit: 1 });
      return { promedio: meta.promedio, total: meta.totalResenas, pendientes: meta.pendientes };
    },
  });
}

export function useActualizarResena() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, ...body }: ActualizarResenaBody & { publicId: string }) =>
      resenasApi.actualizar(publicId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resenas'] }),
  });
}
