import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { descargarArchivo } from '@/lib/descargar';
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

/** Nombre del archivo: «reporte-mes-2026-11.csv» o «reporte-semana-2026-11-16.csv» */
export function nombreArchivo(periodo: PeriodoReporte, desde: string) {
  return `reporte-${periodo}-${periodo === 'mes' ? desde.slice(0, 7) : desde}.csv`;
}

/** HU-72 · Descarga el CSV de las órdenes del periodo que se está viendo */
export function useExportarReporte() {
  return useMutation({
    mutationFn: async ({ periodo, desde }: { periodo: PeriodoReporte; desde: string }) => {
      const archivo = await reportesApi.exportar(periodo, desde);
      descargarArchivo(archivo, nombreArchivo(periodo, desde));
    },
  });
}
