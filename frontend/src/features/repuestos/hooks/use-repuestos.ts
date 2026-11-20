import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CategoriaRepuesto } from '@/types';
import {
  repuestosApi,
  type ActualizarRepuestoBody,
  type CrearRepuestoBody,
  type RegistrarMovimientoBody,
} from '../api/repuestos-api';

export interface FiltroInventario {
  q?: string;
  categoria?: CategoriaRepuesto;
  critico?: boolean;
}

/** HU-54 · Lista de repuestos con búsqueda, filtros y paginación */
export function useRepuestos({ q, categoria, critico }: FiltroInventario) {
  return useInfiniteQuery({
    queryKey: ['repuestos', 'lista', q ?? '', categoria ?? '', Boolean(critico)],
    queryFn: ({ pageParam }) => repuestosApi.listar({ q, categoria, critico, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

/**
 * Totales globales del taller (total de repuestos activos y cuántos están en stock crítico)
 * para mostrar en el encabezado, en el chip de filtro y en «Más».
 */
export function useResumenInventario(activo = true) {
  return useQuery({
    queryKey: ['repuestos', 'resumen'],
    enabled: activo,
    queryFn: async () => {
      const [todos, criticos] = await Promise.all([
        repuestosApi.listar({ page: 1, limit: 1 }),
        repuestosApi.listar({ critico: true, page: 1, limit: 1 }),
      ]);
      return { total: todos.meta.total, criticos: criticos.meta.total };
    },
  });
}

/** HU-56 · Búsqueda rápida de repuestos para agregar a una cotización */
export function useBuscarRepuestos(q: string, activo = true) {
  return useQuery({
    queryKey: ['repuestos', 'lista', 'cotizacion', q],
    enabled: activo,
    placeholderData: keepPreviousData,
    queryFn: () =>
      repuestosApi.listar({ q: q || undefined, page: 1, limit: 50 }).then((r) => r.data),
  });
}

/** Detalle de un repuesto con sus últimos 20 movimientos (HU-52, HU-54) */
export function useRepuesto(publicId: string | null) {
  return useQuery({
    queryKey: ['repuestos', 'detalle', publicId],
    enabled: Boolean(publicId),
    queryFn: () => repuestosApi.obtener(publicId!),
  });
}

/** Registra entrada, salida o ajuste y actualiza lista, resumen y detalle sin recargar (HU-54) */
export function useRegistrarMovimiento(publicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegistrarMovimientoBody) => repuestosApi.registrarMovimiento(publicId, body),
    onSuccess: (detalle) => {
      qc.setQueryData(['repuestos', 'detalle', publicId], detalle);
      return Promise.all([
        qc.invalidateQueries({ queryKey: ['repuestos', 'lista'] }),
        qc.invalidateQueries({ queryKey: ['repuestos', 'resumen'] }),
      ]);
    },
  });
}

/** Crea un repuesto nuevo y refresca inventario y contadores (HU-55) */
export function useCrearRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearRepuestoBody) => repuestosApi.crear(body),
    onSuccess: (creado) => {
      qc.setQueryData(['repuestos', 'detalle', creado.publicId], creado);
      return Promise.all([
        qc.invalidateQueries({ queryKey: ['repuestos', 'lista'] }),
        qc.invalidateQueries({ queryKey: ['repuestos', 'resumen'] }),
      ]);
    },
  });
}

/** HU-87 · Edita o desactiva un repuesto y refresca inventario, contadores y detalle */
export function useActualizarRepuesto(publicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ActualizarRepuestoBody) => repuestosApi.actualizar(publicId, body),
    onSuccess: (detalle) => {
      qc.setQueryData(['repuestos', 'detalle', publicId], detalle);
      return Promise.all([
        qc.invalidateQueries({ queryKey: ['repuestos', 'lista'] }),
        qc.invalidateQueries({ queryKey: ['repuestos', 'resumen'] }),
      ]);
    },
  });
}
