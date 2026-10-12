import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { clientesApi, type EditarClienteBody, type NuevoClienteBody } from '../api/clientes-api';

/** HU-25 · Lista con buscador y "Ver más" (páginas de 20) */
export function useClientes(q: string) {
  return useInfiniteQuery({
    queryKey: ['clientes', 'lista', q],
    queryFn: ({ pageParam }) => clientesApi.listar({ q, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.limit < meta.total ? meta.page + 1 : undefined,
    // Mientras se escribe, se sigue viendo el resultado anterior
    placeholderData: keepPreviousData,
  });
}

export function useCliente(publicId: string) {
  return useQuery({
    queryKey: ['clientes', 'detalle', publicId],
    queryFn: () => clientesApi.obtener(publicId),
  });
}

export function useCrearCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NuevoClienteBody) => clientesApi.crear(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useActualizarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: EditarClienteBody }) =>
      clientesApi.actualizar(publicId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}
