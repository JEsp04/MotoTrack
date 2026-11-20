import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { citasApi, type CrearCitaBody } from '../api/citas-api';

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

/** Al crear una cita cambian la agenda y las horas libres */
export function useCrearCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CrearCitaBody) => citasApi.crear(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['citas'] }),
  });
}
