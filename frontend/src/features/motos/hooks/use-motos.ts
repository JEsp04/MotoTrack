import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motosApi, type FiltroMotos, type MotoBody } from '../api/motos-api';

/** Lista de motos. Para el cliente son solo las suyas (HU-27). */
export function useMotos(filtro: FiltroMotos = {}, activo = true) {
  return useQuery({
    queryKey: ['motos', filtro],
    queryFn: () => motosApi.listar(filtro),
    enabled: activo,
  });
}

/** Al guardar una moto cambian las listas de motos y el detalle del cliente */
function useRefrescar() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['motos'] }),
      qc.invalidateQueries({ queryKey: ['clientes'] }),
    ]);
}

export function useCrearMoto() {
  const refrescar = useRefrescar();
  return useMutation({
    mutationFn: (body: MotoBody & { clientePublicId?: string }) => motosApi.crear(body),
    onSuccess: refrescar,
  });
}

export function useActualizarMoto() {
  const refrescar = useRefrescar();
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: Partial<MotoBody> }) =>
      motosApi.actualizar(publicId, body),
    onSuccess: refrescar,
  });
}

/** HU-87 · Elimina una moto registrada por error */
export function useEliminarMoto() {
  const refrescar = useRefrescar();
  return useMutation({
    mutationFn: (publicId: string) => motosApi.eliminar(publicId),
    onSuccess: refrescar,
  });
}
