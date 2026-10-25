import { Link } from 'react-router';
import { Arc, Button, EmptyState, Fab, Initials, Plate, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatPesos } from '@/lib/format';
import type { OrdenResumen } from '@/types';
import { rutaOrden } from '../estados';
import { usePanelTaller } from '../hooks/use-ordenes';

/** Monto como en el panel del prototipo: «$956.000» (sin espacio) en Michroma */
const monto = (v: number) => formatPesos(v).replace('$ ', '$');

/** Orden de las bahías, como en el prototipo: primero lo que espera a alguien */
const PRIORIDAD = [
  'esperando_aprobacion',
  'pendiente_repuesto',
  'en_reparacion',
  'aprobada',
  'lista_entrega',
  'diagnosticada',
  'registrada',
];

const hoy = () => {
  const f = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date());
  return f.charAt(0).toUpperCase() + f.slice(1);
};

/**
 * HU-46 · Panel del taller (StaffHomeScreen del prototipo): lecturas, una tarjeta por moto
 * adentro con su arco, el equipo de hoy y las entregadas recientemente. Usa la lista de
 * órdenes que ya da la API. «Lo que pasó hoy» y la sugerencia de IA llegan con su HU.
 */
export function PanelTaller() {
  const { data, isPending, isError, refetch } = usePanelTaller();

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-24 md:px-7 md:pt-7 lg:pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <p className="text-sm leading-5 text-ink-muted">{hoy()}</p>
          <h1 className="mt-1 text-[30px] leading-[1.05] font-semibold tracking-[-0.04em] md:text-[40px]">
            Motos en el taller
          </h1>
        </div>
        {data && (
          <Lecturas
            abiertas={data.abiertas}
            total={data.totalAbiertas}
            porAprobar={data.porAprobar}
          />
        )}
      </div>

      {isPending && (
        <div
          className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]"
          role="status"
          aria-label="Cargando"
        >
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-52 rounded-md" />
          ))}
        </div>
      )}
      {isError && (
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
      )}

      {data &&
        (data.abiertas.length === 0 ? (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="clipboard"
              title="No hay motos adentro"
              text="Recibe una moto para crear la primera orden del día."
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
            {[...data.abiertas]
              .sort((a, b) => PRIORIDAD.indexOf(a.estado) - PRIORIDAD.indexOf(b.estado))
              .map((o) => (
                <li key={o.publicId}>
                  <Bahia orden={o} />
                </li>
              ))}
          </ul>
        ))}

      {data && <EquipoHoy abiertas={data.abiertas} />}

      {data && data.recientes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="mt-1.5 text-[15px] font-semibold text-ink-muted">
            Entregadas recientemente
          </h2>
          <ul className="border-t border-border">
            {data.recientes.slice(0, 4).map((o) => (
              <li key={o.publicId} className="border-b border-border">
                <Link
                  to={rutaOrden('admin', o.publicId)}
                  className="grid grid-cols-[86px_minmax(0,1fr)_auto] items-center gap-4 px-1 py-3 text-[15px] md:grid-cols-[96px_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <span className="justify-self-start rounded-[6px] border-[1.5px] border-border-strong bg-surface-sunken px-2 pt-1 pb-1 font-num text-xs leading-none tracking-[0.12em] text-ink-muted">
                    {o.moto.placa}
                  </span>
                  <span className="truncate">
                    {o.moto.marca} {o.moto.referencia}
                  </span>
                  <span className="hidden truncate text-sm text-ink-muted md:block">
                    {o.moto.cliente.nombre}, con {o.mecanico.nombre.split(' ')[0]}
                  </span>
                  <span className="font-num text-sm whitespace-nowrap">{monto(o.costoTotal)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Fab label="Nueva orden" to="/admin/ordenes/nueva" />
    </div>
  );
}

function Lecturas({
  abiertas,
  total,
  porAprobar,
}: {
  abiertas: OrdenResumen[];
  total: number;
  porAprobar: number;
}) {
  const sinRepuesto = abiertas.filter((o) => o.estado === 'pendiente_repuesto').length;
  const cotizado = abiertas.reduce((s, o) => s + o.costoTotal, 0);
  const lecturas = [
    { n: String(total), label: 'adentro' },
    { n: String(porAprobar), label: 'espera al cliente', hot: true },
    { n: String(sinRepuesto), label: 'sin repuesto' },
    { n: monto(cotizado), label: 'cotizado abierto' },
  ];
  return (
    <ul className="grid grid-cols-2 gap-2.5 md:flex md:gap-2" aria-label="Resumen del taller">
      {lecturas.map((l) => (
        <li key={l.label}>
          <Link
            to="/admin/ordenes"
            className="flex flex-col items-start gap-0.5 rounded-[18px] bg-surface-sunken px-3.5 py-3 text-ink transition-transform duration-150 ease-out active:scale-[0.97] md:bg-transparent md:px-3 md:py-1.5"
          >
            <span
              className={cn(
                'font-num text-[22px] leading-[1.2] tracking-[-0.01em]',
                l.hot && 'text-accent-text',
              )}
            >
              {l.n}
            </span>
            <span className="text-sm text-ink-muted">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Pie de la tarjeta, como foot() del prototipo (sin la fecha de entrega, que aún no existe) */
function Pie({ orden: o }: { orden: OrdenResumen }) {
  const primer = o.mecanico.nombre.split(' ')[0];
  if (o.estado === 'esperando_aprobacion')
    return <Bandera tono="accent">Espera al cliente</Bandera>;
  if (o.estado === 'pendiente_repuesto') return <Bandera tono="danger">Falta repuesto</Bandera>;
  if (o.estado === 'registrada')
    return <span className="min-w-0 truncate">{primer} debe diagnosticar</span>;
  if (o.estado === 'lista_entrega')
    return <span className="min-w-0 truncate">Lista para entregar</span>;
  return <span className="min-w-0 truncate">Con {primer}</span>;
}

/** Tarjeta de una moto adentro (.hp-bay del prototipo) */
function Bahia({ orden: o }: { orden: OrdenResumen }) {
  const { label, paso } = ESTADOS_ORDEN[o.estado];
  const espera = o.estado === 'esperando_aprobacion';
  const repuesto = o.estado === 'pendiente_repuesto';

  return (
    <Link
      to={rutaOrden('admin', o.publicId)}
      className={cn(
        'flex h-full flex-col gap-3.5 rounded-md p-4 text-ink transition-[transform,background-color] duration-150 ease-out active:scale-[0.985]',
        espera
          ? 'bg-surface shadow-[0_24px_40px_-28px_var(--color-ink)] ring-[1.5px] ring-ink ring-inset'
          : 'bg-surface-sunken hover:bg-surface-2',
      )}
    >
      <span className="flex items-center justify-between">
        <Plate placa={o.moto.placa} />
        <span className="text-sm leading-5 text-ink-muted">#{o.numero}</span>
      </span>
      <span className="flex items-center gap-3.5">
        <span className="relative size-20 shrink-0">
          <Arc paso={paso} espera={espera} alerta={repuesto} className="size-full" />
          <span className="absolute inset-0 flex items-center justify-center pt-1 font-num text-2xl">
            {paso}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold tracking-[-0.01em]">{label}</span>
          <span className="block truncate text-sm leading-5 text-ink-muted">
            {o.moto.marca} {o.moto.referencia}
          </span>
          <span className="block truncate text-sm leading-5 text-ink-muted">
            {o.moto.cliente.nombre}
          </span>
        </span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        <Pie orden={o} />
        {o.costoTotal > 0 ? (
          <span className="font-num text-sm whitespace-nowrap">{monto(o.costoTotal)}</span>
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
        className={cn(
          'size-2 shrink-0 rounded-full',
          tono === 'accent' ? 'bg-accent' : 'bg-danger',
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/** Carga de cada mecánico con sus motos abiertas (.hp-mech del prototipo) */
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
      <h2 className="mt-1.5 text-[15px] font-semibold text-ink-muted">Equipo hoy</h2>
      <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
        {[...porMecanico.entries()].map(([id, m]) => {
          const espera = m.ordenes.filter((o) => o.estado === 'esperando_aprobacion').length;
          const primera = m.ordenes[0]!;
          return (
            <li
              key={id}
              className="flex items-center gap-3.5 rounded-md px-4 py-4 ring-1 ring-border ring-inset"
            >
              <Initials nombre={m.nombre} className="size-12 rounded-[14px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m.nombre}</span>
                <span className="block truncate text-sm leading-5 text-ink-muted">
                  {ESTADOS_ORDEN[primera.estado].label}: {primera.moto.marca}{' '}
                  {primera.moto.referencia}
                </span>
                <span className="mt-2.5 flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((k) => (
                    <i
                      key={k}
                      className={cn(
                        'h-1 flex-1 rounded-[3px]',
                        k < espera ? 'bg-accent' : k < m.ordenes.length ? 'bg-ink' : 'bg-surface-2',
                      )}
                    />
                  ))}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="font-num text-[22px] leading-[1.2]">{m.ordenes.length}</span>
                <span className="text-sm text-ink-muted">
                  {m.ordenes.length === 1 ? 'moto' : 'motos'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
