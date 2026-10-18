import { Link } from 'react-router';
import { Arc, Button, EmptyState, Plate, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatPesos } from '@/lib/format';
import type { OrdenResumen } from '@/types';
import { rutaOrden } from '../estados';
import { usePanelTaller } from '../hooks/use-ordenes';

/**
 * HU-46 · Panel del taller: lecturas, una tarjeta por moto adentro con su arco,
 * el equipo de hoy y las entregadas recientemente. Usa la lista de órdenes que ya da la API.
 */
export function PanelTaller() {
  const { data, isPending, isError, refetch } = usePanelTaller();

  if (isPending) {
    return (
      <div
        className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
        aria-label="Cargando"
      >
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-52 rounded-md" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon="alert"
        title="No pudimos cargar el taller"
        text="Revisa tu conexión e inténtalo de nuevo."
        action={
          <Button variant="secondary" icon="refresh" onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const sinRepuesto = data.abiertas.filter((o) => o.estado === 'pendiente_repuesto').length;
  const lecturas = [
    { n: data.totalAbiertas, label: 'adentro', to: '/admin/ordenes' },
    { n: data.porAprobar, label: 'espera al cliente', to: '/admin/ordenes', hot: true },
    { n: sinRepuesto, label: 'sin repuesto', to: '/admin/ordenes' },
    { n: data.listas, label: 'listas para entregar', to: '/admin/ordenes' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-2 gap-2.5 md:flex md:gap-2" aria-label="Resumen del taller">
        {lecturas.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="flex flex-col rounded-[18px] bg-surface-sunken px-3.5 py-3 transition-transform duration-150 ease-out active:scale-[0.97] md:bg-transparent md:px-3 md:py-1.5 md:hover:bg-surface-sunken"
            >
              <span
                className={cn(
                  'font-num text-[22px] leading-tight',
                  l.hot && l.n > 0 && 'text-accent-text',
                )}
              >
                {l.n}
              </span>
              <span className="text-sm text-ink-muted">{l.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {data.abiertas.length === 0 ? (
        <EmptyState
          icon="moto"
          title="No hay motos en el taller"
          text="Cuando recibas una moto, aquí verás cómo va cada reparación."
          action={
            <Link
              to="/admin/ordenes/nueva"
              className="inline-flex min-h-touch items-center rounded-full bg-primary px-6 font-semibold text-on-primary"
            >
              Recibir moto
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {data.abiertas.map((o) => (
            <li key={o.publicId}>
              <Bahia orden={o} />
            </li>
          ))}
        </ul>
      )}

      <EquipoHoy abiertas={data.abiertas} />

      {data.recientes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-ink-muted">Entregadas recientemente</h2>
          <ul className="border-t border-border">
            {data.recientes.map((o) => (
              <li key={o.publicId} className="border-b border-border">
                <Link
                  to={rutaOrden('admin', o.publicId)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-1 py-3 hover:bg-surface-sunken md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <Plate placa={o.moto.placa} size="sm" />
                  <span className="truncate">
                    {o.moto.marca} {o.moto.referencia}
                  </span>
                  <span className="hidden truncate text-sm text-ink-muted md:block">
                    {o.moto.cliente.nombre}, con {o.mecanico.nombre.split(' ')[0]}
                  </span>
                  <span className="font-num text-sm">{formatPesos(o.costoTotal)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Tarjeta de una moto adentro: placa, arco del paso, estado, cliente y total. */
function Bahia({ orden: o }: { orden: OrdenResumen }) {
  const { label, paso } = ESTADOS_ORDEN[o.estado];
  const espera = o.estado === 'esperando_aprobacion';
  const repuesto = o.estado === 'pendiente_repuesto';

  return (
    <Link
      to={rutaOrden('admin', o.publicId)}
      className={cn(
        'flex h-full flex-col gap-3.5 rounded-md p-[18px] transition-[transform,background-color] duration-150 ease-out active:scale-[0.985]',
        espera
          ? 'bg-surface shadow-sheet ring-[1.5px] ring-ink'
          : 'bg-surface-sunken hover:bg-surface-2',
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <Plate placa={o.moto.placa} size="sm" />
        <span className="font-num text-xs text-ink-muted">#{o.numero}</span>
      </span>
      <span className="flex items-center gap-3.5">
        <span className="relative size-[78px] shrink-0">
          <Arc paso={paso} espera={espera} alerta={repuesto} className="size-full" />
          <span className="absolute inset-0 flex items-center justify-center pt-1 font-num text-2xl">
            {paso}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] leading-snug font-semibold">{label}</span>
          <span className="block truncate text-sm text-ink-muted">
            {o.moto.marca} {o.moto.referencia}
          </span>
          <span className="block truncate text-sm text-ink-muted">{o.moto.cliente.nombre}</span>
        </span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        {espera ? (
          <Bandera tono="accent">Espera al cliente</Bandera>
        ) : repuesto ? (
          <Bandera tono="danger">Falta repuesto</Bandera>
        ) : (
          <span className="min-w-0 truncate">Con {o.mecanico.nombre.split(' ')[0]}</span>
        )}
        {o.costoTotal > 0 ? (
          <span className="font-num text-[13px] whitespace-nowrap">
            {formatPesos(o.costoTotal)}
          </span>
        ) : (
          <span className="text-ink-muted">Sin cotizar</span>
        )}
      </span>
    </Link>
  );
}

function Bandera({ tono, children }: { tono: 'accent' | 'danger'; children: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold',
        tono === 'accent' ? 'text-accent-text' : 'text-danger-text',
      )}
    >
      <i
        className={cn('size-2 rounded-full', tono === 'accent' ? 'bg-accent' : 'bg-danger')}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/** Carga de cada mecánico con las motos abiertas que tiene asignadas. */
function EquipoHoy({ abiertas }: { abiertas: OrdenResumen[] }) {
  const porMecanico = new Map<string, { nombre: string; ordenes: OrdenResumen[] }>();
  for (const o of abiertas) {
    const m = porMecanico.get(o.mecanico.publicId) ?? { nombre: o.mecanico.nombre, ordenes: [] };
    m.ordenes.push(o);
    porMecanico.set(o.mecanico.publicId, m);
  }
  if (porMecanico.size === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold text-ink-muted">Equipo hoy</h2>
      <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {[...porMecanico.entries()].map(([id, m]) => (
          <li
            key={id}
            className="flex items-center gap-3.5 rounded-md px-[18px] py-4 ring-1 ring-border ring-inset"
          >
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-sm bg-surface-2 text-sm font-semibold">
              {m.nombre
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{m.nombre}</span>
              <span className="mt-2.5 flex gap-1" aria-hidden="true">
                {m.ordenes.slice(0, 6).map((o) => (
                  <i
                    key={o.publicId}
                    className={cn(
                      'h-[5px] flex-1 rounded-full',
                      o.estado === 'esperando_aprobacion' ? 'bg-accent' : 'bg-ink',
                    )}
                  />
                ))}
              </span>
            </span>
            <span className="flex flex-col items-end">
              <span className="font-num text-lg">{m.ordenes.length}</span>
              <span className="text-sm text-ink-muted">
                {m.ordenes.length === 1 ? 'moto' : 'motos'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
