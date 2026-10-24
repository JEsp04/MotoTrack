import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { EstadoOrden, OrdenDetalle } from '@/types';
import {
  ordenesApi,
  type DiagnosticoBody,
  type NuevaOrdenBody,
  type ServicioBody,
} from '../api/ordenes-api';
import type { GrupoId } from '../estados';

/** HU-30 · Lista con pestañas, buscador y "Ver más" */
export function useOrdenes(grupo: GrupoId, q: string) {
  return useInfiniteQuery({
    queryKey: ['ordenes', 'lista', grupo, q],
    queryFn: ({ pageParam }) => ordenesApi.listar({ grupo, q, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

/**
 * HU-46 · Datos del panel del taller con la misma lista de órdenes (sin endpoints nuevos):
 * las abiertas (en proceso, por aprobar y listas) y las últimas cerradas.
 */
export function usePanelTaller() {
  return useQuery({
    queryKey: ['ordenes', 'lista', 'panel'],
    queryFn: async () => {
      const [enProceso, porAprobar, listas, cerradas] = await Promise.all(
        (['en_proceso', 'por_aprobar', 'listas', 'cerradas'] as const).map((grupo) =>
          ordenesApi.listar({ grupo, page: 1, limit: 50 }),
        ),
      );
      return {
        abiertas: [...porAprobar!.data, ...enProceso!.data, ...listas!.data],
        totalAbiertas: enProceso!.meta.total + porAprobar!.meta.total + listas!.meta.total,
        porAprobar: porAprobar!.meta.total,
        listas: listas!.meta.total,
        recientes: cerradas!.data.filter((o) => o.estado !== 'cancelada').slice(0, 5),
      };
    },
  });
}

/**
 * HU-47 · Cuántas órdenes hay en cada pestaña (para los filtros del prototipo).
 * Usa la misma lista de la API pidiendo una sola fila por grupo.
 */
export function useConteoOrdenes() {
  return useQuery({
    queryKey: ['ordenes', 'lista', 'conteo'],
    queryFn: async () => {
      const grupos = ['todas', 'en_proceso', 'por_aprobar', 'listas', 'cerradas'] as const;
      const r = await Promise.all(
        grupos.map((grupo) => ordenesApi.listar({ grupo, page: 1, limit: 1 })),
      );
      return Object.fromEntries(grupos.map((g, i) => [g, r[i]!.meta.total])) as Record<
        (typeof grupos)[number],
        number
      >;
    },
  });
}

/** HU-31 · Detalle */
export function useOrden(publicId: string) {
  return useQuery({
    queryKey: ['ordenes', 'detalle', publicId],
    queryFn: () => ordenesApi.obtener(publicId),
  });
}

export function useCatalogoServicios(activo = true) {
  return useQuery({
    queryKey: ['servicios'],
    queryFn: ordenesApi.catalogo,
    staleTime: 5 * 60_000,
    enabled: activo,
  });
}

/**
 * Tras cualquier cambio: el detalle se actualiza con la respuesta del servidor
 * (sin recargar, HU-35) y se refrescan las listas que muestran el estado.
 */
function useAlGuardar() {
  const qc = useQueryClient();
  return (orden: OrdenDetalle) => {
    qc.setQueryData(['ordenes', 'detalle', orden.publicId], orden);
    return Promise.all([
      qc.invalidateQueries({ queryKey: ['ordenes', 'lista'] }),
      qc.invalidateQueries({ queryKey: ['motos'] }),
      qc.invalidateQueries({ queryKey: ['clientes'] }),
    ]);
  };
}

export function useCrearOrden() {
  const alGuardar = useAlGuardar();
  return useMutation({
    mutationFn: (body: NuevaOrdenBody) => ordenesApi.crear(body),
    onSuccess: alGuardar,
  });
}

export function useCambiarEstado(publicId: string) {
  const alGuardar = useAlGuardar();
  return useMutation({
    mutationFn: ({ estado, observacion }: { estado: EstadoOrden; observacion?: string }) =>
      ordenesApi.cambiarEstado(publicId, estado, observacion),
    onSuccess: alGuardar,
  });
}

export function useGuardarDiagnostico(publicId: string) {
  const alGuardar = useAlGuardar();
  return useMutation({
    mutationFn: (body: DiagnosticoBody) => ordenesApi.guardarDiagnostico(publicId, body),
    onSuccess: alGuardar,
  });
}

export function useAgregarServicio(publicId: string) {
  const alGuardar = useAlGuardar();
  return useMutation({
    mutationFn: (body: ServicioBody) => ordenesApi.agregarServicio(publicId, body),
    onSuccess: alGuardar,
  });
}

export function useQuitarServicio(publicId: string) {
  const alGuardar = useAlGuardar();
  return useMutation({
    mutationFn: (detallePublicId: string) => ordenesApi.quitarServicio(publicId, detallePublicId),
    onSuccess: alGuardar,
  });
}
