import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PeriodoReporte } from '@/types';
import { reportesApi } from '../api/reportes-api';

/** HU-71 · Indicadores del taller en la semana o el mes */
export function useReporte(periodo: PeriodoReporte) {
  return useQuery({
    queryKey: ['reportes', periodo],
    queryFn: () => reportesApi.ver(periodo),
    placeholderData: keepPreviousData,
  });
}
