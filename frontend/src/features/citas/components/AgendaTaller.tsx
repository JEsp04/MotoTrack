import { useState } from 'react';
import { Link } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  ButtonLink,
  EmptyState,
  Fab,
  Page,
  Plate,
  SkeletonList,
} from '@/components/ui';
import { hoyColombia } from '@/lib/format';
import { cn } from '@/lib/cn';
import { parseApiError } from '@/lib/api-error';
import type { Cita, Rol } from '@/types';
import { citaActiva, ESTADO_CITA } from '../estados';
import { diasAgenda, esDomingo, formatDiaCita, nombreDia, numeroDia, partesCita } from '../fechas';
import { useCitas } from '../hooks/use-citas';
import { NuevaCitaSheet } from './NuevaCitaSheet';

const MES = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const tituloMes = (dia: string) => {
  const t = MES.format(new Date(`${dia}T00:00:00Z`)).replace(' de ', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * HU-58 · Agenda de citas del taller (AppointmentsScreen del prototipo): días con un punto
 * si tienen citas y la lista del día elegido. El admin agenda («Nueva cita») y recibe la moto
 * cuando llega; el mecánico la ve en solo lectura.
 */
export function AgendaTaller({ rol }: { rol: Extract<Rol, 'admin' | 'mecanico'> }) {
  const admin = rol === 'admin';
  const hoy = hoyColombia();
  const dias = diasAgenda(hoy);
  const [dia, setDia] = useState(esDomingo(hoy) ? dias.find((d) => d > hoy)! : hoy);
  const [nueva, setNueva] = useState(false);
  const citas = useCitas({ desde: dias[0], hasta: dias.at(-1) });

  const todas = citas.data?.data ?? [];
  const diaDe = (c: Cita) => partesCita(c.fechaHora).dia;
  const conCitas = new Set(todas.filter((c) => c.estado !== 'cancelada').map(diaDe));
  const delDia = todas.filter((c) => diaDe(c) === dia);

  return (
    <>
      <AppBar title="Citas" subtitle={tituloMes(dia)} />
      <Page pb={admin ? 'fab' : undefined}>
        <div
          role="group"
          aria-label="Día"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] lg:mx-0 lg:px-0"
        >
          {dias.map((d) => {
            const on = d === dia;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                aria-label={`${formatDiaCita(d, hoy)}${conCitas.has(d) ? ', con citas' : ''}`}
                onClick={() => setDia(d)}
                className={cn(
                  'flex h-[68px] w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border text-xs font-semibold transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none',
                  on
                    ? 'border-ink bg-ink text-on-primary/70'
                    : 'border-border bg-surface text-ink-muted',
                )}
              >
                {nombreDia(d)}
                <b className={cn('font-num text-lg', on ? 'text-on-primary' : 'text-ink')}>
                  {numeroDia(d)}
                </b>
                <span
                  aria-hidden="true"
                  className={cn('size-[5px] rounded-full', conCitas.has(d) && 'bg-accent')}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg leading-6 font-semibold">{formatDiaCita(dia, hoy)}</h2>
          {citas.isSuccess && (
            <span className="text-sm leading-5 text-ink-muted">
              {delDia.length === 1 ? '1 cita' : `${delDia.length} citas`}
            </span>
          )}
        </div>

        {citas.isPending && <SkeletonList rows={2} />}
        {citas.isError && (
          <Alert>
            {parseApiError(citas.error).message}{' '}
            <button type="button" className="underline" onClick={() => void citas.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {citas.isSuccess &&
          (delDia.length ? (
            <div className="flex flex-col gap-3">
              {delDia.map((c) => (
                <FilaCita key={c.publicId} c={c} admin={admin} />
              ))}
            </div>
          ) : (
            <div className="rounded-md bg-surface-sunken">
              <EmptyState icon="calendar" title="Día libre" text="No hay citas para este día." />
            </div>
          ))}
      </Page>
      {admin && (
        <>
          <Fab label="Cita" onClick={() => setNueva(true)} />
          <NuevaCitaSheet open={nueva} dia={dia} hoy={hoy} onClose={() => setNueva(false)} />
        </>
      )}
    </>
  );
}

/** Una cita en la agenda (.mt-slot): hora a la izquierda y la tarjeta */
function FilaCita({ c, admin }: { c: Cita; admin: boolean }) {
  const { hora } = partesCita(c.fechaHora);
  const estado = ESTADO_CITA[c.estado];
  return (
    <article className="flex items-stretch gap-3" aria-label={`${hora} · ${c.cliente.nombre}`}>
      <div className="w-[52px] shrink-0 pt-3.5 text-sm font-semibold tabular-nums">{hora}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-md bg-surface-sunken p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.cliente.nombre}</p>
            <p className="truncate text-sm leading-5 text-ink-muted">
              {c.moto.marca} {c.moto.referencia}
            </p>
          </div>
          <Plate placa={c.moto.placa} />
        </div>
        <p className="text-sm leading-5 text-ink-muted">{c.motivo}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tono={estado.tono}>{estado.label}</Badge>
          {c.orden ? (
            admin ? (
              <Link
                to={`/admin/ordenes/${c.orden.publicId}`}
                className="text-sm font-semibold underline decoration-border-strong underline-offset-4"
              >
                Orden #{c.orden.numero}
              </Link>
            ) : (
              <span className="text-sm font-semibold">Orden #{c.orden.numero}</span>
            )
          ) : (
            admin &&
            citaActiva(c.estado) && (
              <ButtonLink
                href={`/admin/ordenes/nueva?cita=${c.publicId}`}
                size="sm"
                variant="secondary"
                icon="clipboard"
              >
                Recibir moto
              </ButtonLink>
            )
          )}
        </div>
      </div>
    </article>
  );
}
