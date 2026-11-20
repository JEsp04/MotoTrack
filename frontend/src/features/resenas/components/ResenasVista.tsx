import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  Button,
  Card,
  EmptyState,
  Estrellas,
  Page,
  Plate,
  SkeletonList,
  Tabs,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatFecha } from '@/lib/format';
import { ESTADO_RESENA_LABEL, formatPromedio } from '@/lib/resenas';
import type { EstadoResena, ResenaAdmin } from '@/types';
import { useResenas, useResumenResenas } from '../hooks/use-resenas';
import { ResponderResenaSheet } from './ResponderResenaSheet';

type FiltroId = 'todas' | 'pendiente' | 'adaptada' | '5' | '4' | '3' | '2' | '1';

const FILTROS: FiltroId[] = ['todas', 'pendiente', 'adaptada', '5', '4', '3', '2', '1'];
const ES_FILTRO = (v: string | null): v is FiltroId => FILTROS.includes(v as FiltroId);

const TONO_ESTADO = { pendiente: 'accent', revisada: 'neutral', adaptada: 'success' } as const;

/**
 * HU-89 · Reseñas del taller (admin): promedio de estrellas, filtros por calificación o
 * seguimiento, y cada reseña con su orden, aspectos, comentario y la respuesta del taller.
 * Esta pantalla no está en el prototipo: se arma solo con componentes existentes.
 */
export function ResenasVista({ onBack }: { onBack?: () => void }) {
  const [params, setParams] = useSearchParams();
  const filtroParam = params.get('filtro');
  const filtro: FiltroId = ES_FILTRO(filtroParam) ? filtroParam : 'todas';
  const [elegida, setElegida] = useState<ResenaAdmin | null>(null);

  const estado: EstadoResena | undefined =
    filtro === 'pendiente' || filtro === 'adaptada' ? filtro : undefined;
  const calificacion = /^[1-5]$/.test(filtro) ? Number(filtro) : undefined;

  const resenas = useResenas({ calificacion, estado });
  const resumen = useResumenResenas();
  const lista = resenas.data?.pages.flatMap((p) => p.data) ?? [];
  const r = resumen.data;

  return (
    <>
      <AppBar
        title="Reseñas"
        subtitle={
          r
            ? `${r.total} ${r.total === 1 ? 'reseña' : 'reseñas'} · ${r.pendientes} por revisar`
            : undefined
        }
        onBack={onBack}
      />
      <Page>
        {r && r.total > 0 && r.promedio !== null && (
          <Card>
            <div className="flex items-center gap-4">
              <p className="font-num text-[40px] leading-none">{formatPromedio(r.promedio)}</p>
              <div className="min-w-0">
                <Estrellas valor={Math.round(r.promedio)} size={22} />
                <p className="text-sm leading-5 text-ink-muted">
                  Promedio de {r.total} {r.total === 1 ? 'reseña' : 'reseñas'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Tabs
          label="Filtrar reseñas"
          variant="chips"
          value={filtro}
          onChange={(f) => setParams(f === 'todas' ? {} : { filtro: f }, { replace: true })}
          tabs={[
            { id: 'todas', label: 'Todas' },
            { id: 'pendiente', label: 'Por revisar', count: r?.pendientes },
            { id: 'adaptada', label: 'Adaptadas' },
            { id: '5', label: '5 estrellas' },
            { id: '4', label: '4 estrellas' },
            { id: '3', label: '3 estrellas' },
            { id: '2', label: '2 estrellas' },
            { id: '1', label: '1 estrella' },
          ]}
        />

        {resenas.isPending && <SkeletonList rows={3} />}
        {resenas.isError && (
          <Alert>
            {parseApiError(resenas.error).message}{' '}
            <button type="button" className="underline" onClick={() => resenas.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}

        {resenas.isSuccess && lista.length === 0 && (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="star"
              title={filtro === 'todas' ? 'Aún no hay reseñas' : 'Sin resultados'}
              text={
                filtro === 'todas'
                  ? 'Cuando un cliente califique una orden entregada, la verás aquí.'
                  : 'No hay reseñas con este filtro.'
              }
            />
          </div>
        )}

        {lista.length > 0 && (
          <ul aria-label="Reseñas" className="flex flex-col gap-3">
            {lista.map((resena) => (
              <li key={resena.publicId}>
                <TarjetaResena resena={resena} onResponder={() => setElegida(resena)} />
              </li>
            ))}
          </ul>
        )}
        {resenas.hasNextPage && (
          <Button
            variant="secondary"
            className="self-center"
            loading={resenas.isFetchingNextPage}
            onClick={() => resenas.fetchNextPage()}
          >
            Ver más
          </Button>
        )}
      </Page>

      <ResponderResenaSheet resena={elegida} onClose={() => setElegida(null)} />
    </>
  );
}

function TarjetaResena({ resena, onResponder }: { resena: ResenaAdmin; onResponder: () => void }) {
  return (
    <article
      aria-label={`Reseña de ${resena.cliente.nombre}`}
      className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{resena.cliente.nombre}</p>
          <p className="text-sm leading-5 text-ink-muted">
            Orden #{resena.orden.numero} · {formatFecha(resena.creadoEn)}
          </p>
        </div>
        <Badge tono={TONO_ESTADO[resena.estado]}>{ESTADO_RESENA_LABEL[resena.estado]}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Estrellas valor={resena.calificacion} />
        <Plate placa={resena.orden.moto.placa} size="sm" />
        <span className="text-sm leading-5 text-ink-muted">
          {resena.orden.moto.marca} {resena.orden.moto.referencia}
        </span>
      </div>
      {resena.aspectos.length > 0 && (
        <ul aria-label="Aspectos destacados" className="flex flex-wrap gap-1.5">
          {resena.aspectos.map((a) => (
            <li key={a}>
              <Badge>{a}</Badge>
            </li>
          ))}
        </ul>
      )}
      {resena.comentario && <p className="leading-6">«{resena.comentario}»</p>}
      {resena.respuestaAdmin && (
        <div className="rounded-sm bg-surface p-3">
          <p className="text-sm leading-5 font-semibold">Respuesta del taller</p>
          <p className="text-sm leading-5 text-ink-muted">{resena.respuestaAdmin}</p>
        </div>
      )}
      <Button variant="secondary" size="sm" className="self-start" onClick={onResponder}>
        {resena.respuestaAdmin ? 'Editar respuesta' : 'Responder'}
      </Button>
    </article>
  );
}
