import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Alert,
  Arc,
  Button,
  EmptyState,
  HoldButton,
  List,
  ListItem,
  Plate,
  Skeleton,
  StatusBadge,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatDia } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { EstadoOrden, OrdenResumen } from '@/types';
import { accionesPara, rutaOrden, type Accion } from '../estados';
import { useCambiarEstado, useInicioMecanico } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, textoHold } from '../textos';
import { CambioEstadoSheet } from './CambioEstadoSheet';

/** Orden de urgencia para elegir la moto destacada arriba */
const PRIORIDAD_MECANICO: EstadoOrden[] = [
  'aprobada',
  'en_reparacion',
  'pendiente_repuesto',
  'registrada',
  'diagnosticada',
  'esperando_aprobacion',
  'lista_entrega',
];

function ordenarUrgencia(a: OrdenResumen, b: OrdenResumen) {
  if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
  return PRIORIDAD_MECANICO.indexOf(a.estado) - PRIORIDAD_MECANICO.indexOf(b.estado);
}

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

function fechaCorta(iso: string) {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  })
    .format(d)
    .replace('.', '')
    .replace(' de ', ' ');
  const hora = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  }).format(d);
  return `${dia} · ${hora}`;
}

/**
 * HU-64 · Inicio del mecánico (`/mecanico`):
 * saludo con su nombre, 5 lecturas rápidas, orden más urgente arriba con su `HoldButton`
 * para avanzar sin salir del inicio, cola de trabajo y últimos cambios de estado («Actividad»).
 */
export function InicioMecanico() {
  const usuario = useSession((s) => s.usuario);
  const { data, isPending, isError, refetch } = useInicioMecanico();
  const [accionSheet, setAccionSheet] = useState<{ orden: OrdenResumen; accion: Accion } | null>(
    null,
  );

  const primerNombre = usuario?.nombre.split(' ')[0] ?? 'mecánico';
  const abiertas = data ? [...data.abiertas].sort(ordenarUrgencia) : [];
  const urgente = abiertas[0] ?? null;
  const cola = abiertas.slice(1, 6);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-24 md:px-7 md:pt-7 lg:pb-10">
      <div>
        <p className="text-sm leading-5 text-ink-muted">{hoy()}</p>
        <h1 className="mt-1 text-[30px] leading-[1.05] font-semibold tracking-[-0.04em] md:text-[40px]">
          Hola, {primerNombre}
        </h1>
      </div>

      {isPending && (
        <div className="flex flex-col gap-4" role="status" aria-label="Cargando">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-20 rounded-[18px]" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-md" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon="alert"
          title="No pudimos cargar tu día"
          text="Revisa tu conexión e inténtalo de nuevo."
          action={
            <Button variant="secondary" icon="refresh" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {data && (
        <>
          <Lecturas abiertas={abiertas} />

          {!urgente ? (
            <div className="rounded-md bg-surface-sunken">
              <EmptyState
                icon="clipboard"
                title="Aún no tienes órdenes"
                text="Cuando el administrador te asigne una moto, aparecerá aquí."
              />
            </div>
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-ink-muted">Sigue con esta moto</h2>
                  <Link
                    to={rutaOrden('mecanico', urgente.publicId)}
                    className="inline-flex min-h-touch items-center px-2 text-sm font-semibold text-ink underline decoration-border-strong underline-offset-4"
                  >
                    Ver detalle
                  </Link>
                </div>
                <TarjetaUrgente
                  orden={urgente}
                  onAbrirSheet={(accion) => setAccionSheet({ orden: urgente, accion })}
                />
              </section>

              {cola.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[15px] font-semibold text-ink-muted">Mi cola de trabajo</h2>
                    <Link
                      to="/mecanico/ordenes"
                      className="inline-flex min-h-touch items-center px-2 text-sm font-semibold text-ink underline decoration-border-strong underline-offset-4"
                    >
                      Ver todas
                    </Link>
                  </div>
                  <ul
                    aria-label="Mi cola de trabajo"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
                  >
                    {cola.map((o) => (
                      <li key={o.publicId}>
                        <Link
                          to={rutaOrden('mecanico', o.publicId)}
                          className="flex h-full flex-col gap-2.5 rounded-md bg-surface-sunken p-4 text-ink transition-colors duration-150 hover:bg-surface-2"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <Plate placa={o.moto.placa} />
                            <StatusBadge estado={o.estado} />
                          </span>
                          <span className="truncate font-semibold">
                            {o.moto.marca} {o.moto.referencia}
                          </span>
                          <span className="mt-auto flex items-center justify-between gap-2 text-sm text-ink-muted">
                            <span className="truncate">{o.moto.cliente.nombre}</span>
                            <span>#{o.numero}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-[15px] font-semibold text-ink-muted">Actividad</h2>
            {data.actividad.length === 0 ? (
              <p className="text-sm leading-5 text-ink-muted">Sin movimientos recientes.</p>
            ) : (
              <List label="Actividad">
                {data.actividad.map((ev, i) => (
                  <ListItem
                    key={`${ev.ordenPublicId}-${ev.creadoEn}-${i}`}
                    icon="history"
                    title={`${ETIQUETA_ESTADO[ev.estadoNuevo]} · #${ev.numero}`}
                    subtitle={`${ev.placa} · ${ev.observacion || ev.usuario.nombre}`}
                    to={rutaOrden('mecanico', ev.ordenPublicId)}
                    trailing={
                      <span className="text-xs whitespace-nowrap text-ink-muted">
                        {fechaCorta(ev.creadoEn)}
                      </span>
                    }
                  />
                ))}
              </List>
            )}
          </section>
        </>
      )}

      {accionSheet && (
        <CambioEstadoSheet
          ordenPublicId={accionSheet.orden.publicId}
          estadoActual={accionSheet.orden.estado}
          accion={accionSheet.accion}
          total={accionSheet.orden.costoTotal}
          onClose={() => setAccionSheet(null)}
        />
      )}
    </div>
  );
}

function Lecturas({ abiertas }: { abiertas: OrdenResumen[] }) {
  const contar = (estado: EstadoOrden) => abiertas.filter((o) => o.estado === estado).length;
  const lecturas: Array<{
    label: string;
    valor: number;
    tono?: 'accent' | 'danger' | 'success';
  }> = [
    { label: 'Mis órdenes', valor: abiertas.length },
    { label: 'Por diagnosticar', valor: contar('registrada'), tono: 'accent' },
    { label: 'En reparación', valor: contar('en_reparacion') },
    { label: 'Sin repuesto', valor: contar('pendiente_repuesto'), tono: 'danger' },
    { label: 'Listas', valor: contar('lista_entrega'), tono: 'success' },
  ];

  return (
    <ul
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
      aria-label="Resumen de mi día"
    >
      {lecturas.map((l) => (
        <li key={l.label}>
          <Link
            to="/mecanico/ordenes"
            className="flex flex-col items-start gap-0.5 rounded-[18px] bg-surface-sunken px-3.5 py-3 text-ink transition-colors duration-150 hover:bg-surface-2"
          >
            <span
              className={cn(
                'font-num text-[22px] leading-[1.2] tracking-[-0.01em]',
                l.valor > 0 && l.tono === 'accent' && 'text-accent-text',
                l.valor > 0 && l.tono === 'danger' && 'text-danger-text',
                l.valor > 0 && l.tono === 'success' && 'text-success-text',
              )}
            >
              {l.valor}
            </span>
            <span className="text-sm text-ink-muted">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TarjetaUrgente({
  orden: o,
  onAbrirSheet,
}: {
  orden: OrdenResumen;
  onAbrirSheet: (accion: Accion) => void;
}) {
  const navigate = useNavigate();
  const cambiar = useCambiarEstado(o.publicId);
  const [error, setError] = useState<string | null>(null);
  const { label, paso } = ESTADOS_ORDEN[o.estado];
  const acciones = accionesPara(o.estado, 'mecanico_asignado');
  const directas = acciones.filter((a) => !a.confirmar && !a.observacion && !a.pideCodigo);
  const conHoja = acciones.filter((a) => a.confirmar || a.observacion || a.pideCodigo);

  async function confirmarDirecto(accion: Accion) {
    setError(null);
    try {
      await cambiar.mutateAsync({ estado: accion.a });
      toast(`Orden: ${ETIQUETA_ESTADO[accion.a]}`, 'success');
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md bg-surface p-4 ring-[1.5px] ring-ink ring-inset">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Plate placa={o.moto.placa} />
          <span className="text-sm font-semibold text-ink-muted">#{o.numero}</span>
        </div>
        <StatusBadge estado={o.estado} />
      </div>

      <div className="flex items-center gap-3.5">
        <span className="relative size-20 shrink-0">
          <Arc
            paso={paso}
            espera={o.estado === 'esperando_aprobacion'}
            alerta={o.estado === 'pendiente_repuesto'}
            className="size-full"
          />
          <span className="absolute inset-0 flex items-center justify-center pt-1 font-num text-2xl">
            {paso}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold tracking-[-0.01em]">{label}</p>
          <p className="truncate text-sm leading-5 text-ink-muted">
            {o.moto.marca} {o.moto.referencia} · {o.moto.cliente.nombre}
          </p>
          {o.fechaEstimadaEntrega && (
            <p
              className={cn(
                'text-sm leading-5',
                o.atrasada ? 'font-semibold text-danger-text' : 'text-ink-muted',
              )}
            >
              {o.atrasada
                ? `Atrasada · ${formatDia(o.fechaEstimadaEntrega)}`
                : `Entrega ${formatDia(o.fechaEstimadaEntrega)}`}
            </p>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap gap-2.5">
        {o.estado === 'registrada' && (
          <Button
            icon="wrench"
            onClick={() => void navigate(rutaOrden('mecanico', o.publicId))}
            className="flex-1"
          >
            Registrar diagnóstico
          </Button>
        )}
        {directas.map((accion) => {
          const t = textoHold(accion.label);
          return (
            <HoldButton
              key={accion.label}
              label={t.mantener}
              doneLabel={t.soltar}
              variant={accion.variante === 'danger' ? 'danger' : 'primary'}
              loading={cambiar.isPending}
              onConfirm={() => void confirmarDirecto(accion)}
              className="flex-1"
            />
          );
        })}
        {conHoja.map((accion) => (
          <Button key={accion.label} variant={accion.variante} onClick={() => onAbrirSheet(accion)}>
            {accion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
