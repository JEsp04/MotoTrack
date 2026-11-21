import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recordatoriosApi, type PestanaRecordatorios } from '../api/recordatorios-api';

/** HU-75 · Recordatorios por revisar o ya revisados */
export function useRecordatorios(estado: PestanaRecordatorios, activo = true) {
  return useQuery({
    queryKey: ['recordatorios', estado],
    queryFn: () => recordatoriosApi.listar(estado),
    enabled: activo,
    placeholderData: keepPreviousData,
  });
}

export function useAprobarRecordatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => recordatoriosApi.aprobar(publicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recordatorios'] }),
  });
}

export function useRechazarRecordatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, motivo }: { publicId: string; motivo: string }) =>
      recordatoriosApi.rechazar(publicId, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recordatorios'] }),
  });
}
