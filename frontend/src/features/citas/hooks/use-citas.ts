import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  citasApi,
  type ActualizarCitaBody,
  type CrearCitaBody,
  type FiltroCitas,
} from '../api/citas-api';

export function useCita(publicId: string) {
  return useQuery({
    queryKey: ['citas', 'detalle', publicId],
    queryFn: () => citasApi.obtener(publicId),
  });
}

/** Horas libres del día elegido (solo las que no han pasado ni están tomadas) */
export function useHorasLibres(fecha: string) {
  return useQuery({
    queryKey: ['citas', 'horas-libres', fecha],
    queryFn: () => citasApi.horasLibres(fecha),
  });
}

/** Citas del usuario (para el cliente, solo las suyas) */
export function useCitas(filtro: FiltroCitas = {}) {
  return useQuery({ queryKey: ['citas', 'lista', filtro], queryFn: () => citasApi.listar(filtro) });
}

/** HU-60 · Reprogramar o cancelar. La hora anterior queda libre. */
export function useActualizarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: ActualizarCitaBody }) =>
      citasApi.actualizar(publicId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
  });
}

/** Al crear una cita cambian la agenda y las horas libres */
export function useCrearCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearCitaBody) => citasApi.crear(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
  });
}
