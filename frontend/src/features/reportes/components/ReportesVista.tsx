import { useState } from 'react';
import {
  Alert,
  AppBar,
  Button,
  Card,
  KpiTile,
  Page,
  Segmented,
  Skeleton,
  SkeletonList,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import type { PeriodoReporte, Reporte } from '@/types';
import { useExportarReporte, useReporte } from '../hooks/use-reportes';
import { abreviarPesos, comparacion, formatDias } from './formato';

/**
 * HU-71 · «Reportes · Indicadores del taller» (ReportsScreen del prototipo): segmentado
 * Semana / Mes, lecturas, «Órdenes por día» y «Servicios más frecuentes».
 * «Clientes recuperados por alertas IA» se omite: la app todavía no tiene esos datos.
 */
export function ReportesVista({ onBack }: { onBack?: () => void }) {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('mes');
  const reporte = useReporte(periodo);
  const r = reporte.data;
  const exportar = useExportarReporte();

  /** HU-72 · Descarga el CSV de las órdenes del periodo */
  function exportarExcel(r: Reporte) {
    exportar.mutate(
      { periodo, desde: r.desde },
      {
        onSuccess: () => toast('Reporte exportado a Excel', 'success'),
        onError: (e) => toast(parseApiError(e).message, 'danger'),
      },
    );
  }

  return (
    <>
      <AppBar title="Reportes" subtitle="Indicadores del taller" onBack={onBack} />
      <Page>
        <Segmented
          label="Periodo del reporte"
          value={periodo}
          onChange={setPeriodo}
          options={[
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mes' },
          ]}
        />

        {reporte.isError && (
          <Alert>
            {parseApiError(reporte.error).message}{' '}
            <button type="button" className="underline" onClick={() => void reporte.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}

        {reporte.isPending && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Skeleton className="h-[108px] rounded-md" />
              <Skeleton className="h-[108px] rounded-md" />
              <Skeleton className="col-span-2 h-[108px] rounded-md lg:col-span-1" />
            </div>
            <SkeletonList rows={2} />
          </>
        )}

        {r && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <KpiTile
                label="Ingresos (COP)"
                value={abreviarPesos(r.ingresos)}
                tono="success"
                hint={comparacion(r.anterior.variacionIngresos, r.anterior.nombre)}
              />
              <KpiTile label="Órdenes cerradas" value={r.ordenesCerradas} />
              <KpiTile
                label="Días promedio"
                value={formatDias(r.diasPromedio)}
                tono="navy"
                hint="ingreso → entrega"
                className="col-span-2 lg:col-span-1"
              />
            </div>

            <Card title="Órdenes por día">
              <Barras datos={r.porDia} />
            </Card>

            <Card title="Servicios más frecuentes">
              <Servicios servicios={r.servicios} />
            </Card>

            <Button
              variant="secondary"
              icon="arrowDown"
              fullWidth
              loading={exportar.isPending}
              onClick={() => exportarExcel(r)}
            >
              Exportar a Excel
            </Button>
          </>
        )}
      </Page>
    </>
  );
}

/** Gráfica de barras (.mt-bars del prototipo); el día con más órdenes va en tinta */
function Barras({ datos }: { datos: Reporte['porDia'] }) {
  const max = Math.max(1, ...datos.map((d) => d.ordenes));
  const alto = datos.some((d) => d.ordenes > 0) ? max : 0;
  return (
    <div
      role="img"
      aria-label={`Órdenes por día: ${datos.map((d) => `${d.dia} ${d.ordenes}`).join(', ')}`}
      className="flex h-[120px] items-end gap-2.5 tabular-nums"
    >
      {datos.map((d) => {
        const hi = alto > 0 && d.ordenes === alto;
        return (
          <div
            key={d.dia}
            className={cn(
              'flex h-full flex-1 flex-col items-center justify-end gap-1.5 text-xs',
              hi ? 'font-semibold text-ink' : 'text-ink-muted',
            )}
          >
            <b className="text-xs font-semibold text-ink">{d.ordenes}</b>
            <i
              className={cn(
                'block w-full max-w-7 rounded-[8px_8px_3px_3px]',
                hi ? 'bg-ink' : 'bg-surface-2',
              )}
              style={{ height: `${Math.max(8, (d.ordenes / max) * 80)}px` }}
            />
            {d.dia}
          </div>
        );
      })}
    </div>
  );
}

function Servicios({ servicios }: { servicios: Reporte['servicios'] }) {
  if (servicios.length === 0) {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Aún no hay órdenes entregadas en este periodo.
      </p>
    );
  }
  const max = servicios[0]!.veces;
  return (
    <ul aria-label="Servicios más frecuentes" className="flex flex-col gap-2.5">
      {servicios.map((s) => (
        <li key={s.nombre}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{s.nombre}</span>
            <span className="font-semibold tabular-nums">{s.veces}</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-[3px] bg-surface-2">
            <i
              className="block h-full rounded-[3px] bg-ink"
              style={{ width: `${(s.veces / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
