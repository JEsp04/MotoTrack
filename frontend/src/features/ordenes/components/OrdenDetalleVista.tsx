import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  Badge,
  Button,
  Card,
  DataList,
  Dial,
  EmptyState,
  HoldButton,
  Icon,
  IconButton,
  Page,
  Plate,
  Skeleton,
  SkeletonList,
  StatusBadge,
  Stepper,
  Tabs,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN, PASOS } from '@/lib/estados-orden';
import { formatFecha, formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { OrdenDetalle, Rol } from '@/types';
import { accionesPara, actorDe, ESTADOS_EDITABLES, type Accion, type Actor } from '../estados';
import { useCambiarEstado, useOrden, useQuitarServicio } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, textoHold } from '../textos';
import { CambioEstadoSheet } from './CambioEstadoSheet';
import { DiagnosticoSheet } from './DiagnosticoSheet';
import { SeguimientoCliente } from './SeguimientoCliente';
import { ServicioSheet } from './ServicioSheet';

const km = new Intl.NumberFormat('es-CO');
const ROL: Record<Rol, string> = {
  admin: 'Admin',
  mecanico: 'Mecánico',
  cliente: 'Cliente',
};

/** Fecha corta del historial, como en el prototipo: «17 oct · 8:20» */
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

type Pestana = 'resumen' | 'diagnostico' | 'servicios' | 'historial';

/** HU-31, HU-48 · Detalle de la orden para los 3 roles, con solo las acciones de cada uno */
export function OrdenDetalleVista({ publicId }: { publicId: string }) {
  const navigate = useNavigate();
  const usuario = useSession((s) => s.usuario);
  const orden = useOrden(publicId);
  const volver = () => navigate(-1);

  if (orden.isPending) {
    return (
      <>
        <AppBar title="Orden" onBack={volver} />
        <Page narrow>
          <div role="status" aria-label="Cargando" className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full" />
            <SkeletonList rows={2} />
          </div>
        </Page>
      </>
    );
  }

  if (orden.isError || !usuario) {
    const e = parseApiError(orden.error);
    return (
      <>
        <AppBar title="Orden" onBack={volver} />
        <Page narrow>
          {e.status === 404 ? (
            <EmptyState
              icon="clipboard"
              title="No encontramos esta orden"
              text="Puede que no tengas acceso a ella o que la dirección esté mal."
              action={<Button onClick={volver}>Volver</Button>}
            />
          ) : (
            <Alert>
              {e.message}{' '}
              <button type="button" className="underline" onClick={() => orden.refetch()}>
                Intentar de nuevo
              </button>
            </Alert>
          )}
        </Page>
      </>
    );
  }

  if (usuario.rol === 'cliente') {
    return <SeguimientoCliente orden={orden.data} taller={usuario.taller.nombre} />;
  }
  return <Contenido orden={orden.data} actor={actorDe(usuario, orden.data)} rol={usuario.rol} />;
}

/**
 * Detalle igual a OrderDetailScreen del prototipo: encabezado con placa y dial, pestañas
 * Resumen, Diagnóstico, Servicios e Historial, y la barra de acciones con mantener presionado.
 */
function Contenido({ orden, actor, rol }: { orden: OrdenDetalle; actor: Actor | null; rol: Rol }) {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [accion, setAccion] = useState<Accion | null>(null);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const cambiar = useCambiarEstado(orden.publicId);

  const acciones = accionesPara(orden.estado, actor);
  const editable = ESTADOS_EDITABLES.includes(orden.estado);
  const puedeDiagnosticar = actor === 'mecanico_asignado' && editable;
  const puedeEditarServicios = editable && (actor === 'admin' || actor === 'mecanico_asignado');
  // registrada → diagnosticada ocurre al guardar el diagnóstico, como en el prototipo
  const registrarDiagnostico = puedeDiagnosticar && orden.estado === 'registrada';
  const { paso, label } = ESTADOS_ORDEN[orden.estado];

  /** Las acciones sin texto obligatorio se confirman manteniendo presionado, sin hoja (HU-48) */
  async function cambiarDirecto(a: Accion) {
    setErrorAccion(null);
    try {
      await cambiar.mutateAsync({ estado: a.a });
      toast(`Orden: ${ETIQUETA_ESTADO[a.a]}`, 'success');
    } catch (error) {
      setErrorAccion(parseApiError(error).message);
    }
  }

  return (
    <>
      <AppBar
        title={`Orden #${orden.numero}`}
        subtitle={`Ingresó el ${formatFecha(orden.fechaIngreso).replace(/ de \d{4}$/, '')}`}
        onBack={() => navigate(-1)}
      />

      {/* Encabezado: moto, placa y dial (.mt-od-hero) */}
      <section aria-label="Avance de la orden" className="border-b border-border">
        <div className="mx-auto w-full max-w-form px-4 pt-3.5 pb-5 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl leading-6 font-semibold tracking-[-0.02em]">
                {orden.moto.marca} {orden.moto.referencia}
              </p>
              <p className="text-sm leading-5 text-ink-muted">
                {orden.moto.cliente.nombre}, {km.format(orden.kilometrajeIngreso)} km
              </p>
            </div>
            <Plate placa={orden.moto.placa} size="lg" />
          </div>
          <Dial
            paso={paso}
            label={label}
            sub={
              orden.estado === 'cancelada'
                ? undefined
                : `Con ${orden.mecanico.nombre.split(' ')[0]}`
            }
            alerta={orden.estado === 'pendiente_repuesto'}
          />
        </div>
      </section>

      <div className="border-b border-border">
        <div className="mx-auto max-w-form lg:px-4">
          <Tabs
            variant="underline"
            label="Secciones de la orden"
            className="border-b-0"
            value={pestana}
            onChange={setPestana}
            tabs={[
              { id: 'resumen', label: 'Resumen' },
              { id: 'diagnostico', label: 'Diagnóstico' },
              { id: 'servicios', label: 'Servicios' },
              { id: 'historial', label: 'Historial' },
            ]}
          />
        </div>
      </div>

      <Page narrow pb="actionbar">
        {pestana === 'resumen' && <Resumen orden={orden} rol={rol} />}

        {pestana === 'diagnostico' &&
          (orden.diagnostico ? (
            <Card
              title="Diagnóstico"
              action={
                <StatusBadge
                  estado={
                    ['registrada', 'diagnosticada', 'esperando_aprobacion'].includes(orden.estado)
                      ? orden.estado
                      : 'aprobada'
                  }
                />
              }
            >
              <div className="flex flex-col gap-3">
                {orden.diagnostico.prioridad === 'urgente' && (
                  <Badge tono="danger" icon="alert" className="self-start">
                    Urgente
                  </Badge>
                )}
                <div>
                  <p className="text-sm leading-5 font-semibold">Hallazgos</p>
                  <p className="whitespace-pre-line">{orden.diagnostico.hallazgos}</p>
                </div>
                <div>
                  <p className="text-sm leading-5 font-semibold">Recomendación</p>
                  <p className="whitespace-pre-line">{orden.diagnostico.trabajoRecomendado}</p>
                </div>
                <p className="text-sm leading-5 text-ink-muted">
                  Por {orden.diagnostico.mecanico.nombre} ·{' '}
                  {formatFecha(orden.diagnostico.actualizadoEn)}
                </p>
                {puedeDiagnosticar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => setDiagnosticando(true)}
                  >
                    Editar diagnóstico
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <EmptyState
              icon="search"
              title="Sin diagnóstico"
              text="El mecánico aún no ha revisado la moto."
              action={
                puedeDiagnosticar && (
                  <Button icon="search" onClick={() => setDiagnosticando(true)}>
                    Registrar diagnóstico
                  </Button>
                )
              }
            />
          ))}

        {pestana === 'servicios' && (
          <Servicios
            orden={orden}
            editable={puedeEditarServicios}
            onAgregar={() => setAgregandoServicio(true)}
          />
        )}

        {pestana === 'historial' && (
          <Card
            title="Historial de estados"
            action={
              <span className="text-sm text-ink-muted">
                {orden.historial.length} {orden.historial.length === 1 ? 'cambio' : 'cambios'}
              </span>
            }
          >
            <ol className="m-0 list-none p-0" aria-label="Historial de estados">
              {orden.historial.map((h, i) => (
                <li key={`${h.creadoEn}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="flex w-6 shrink-0 flex-col items-center" aria-hidden="true">
                    <span
                      className={cn(
                        'mt-1.5 size-3 shrink-0 rounded-full',
                        h.estadoNuevo === 'esperando_aprobacion' ? 'bg-accent' : 'bg-ink',
                      )}
                    />
                    {i < orden.historial.length - 1 && (
                      <span className="mt-1 w-0.5 flex-1 bg-border" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{ETIQUETA_ESTADO[h.estadoNuevo]}</span>
                      <span className="shrink-0 text-sm text-ink-muted">
                        {fechaCorta(h.creadoEn)}
                      </span>
                    </div>
                    <p className="text-sm leading-5 text-ink-muted">
                      {h.usuario.nombre} ({ROL[h.usuario.rol]})
                    </p>
                    {h.observacion && (
                      <p className="mt-1.5 rounded-sm bg-surface px-3 py-2 text-sm leading-5">
                        {h.observacion}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </Page>

      {/* Barra de acciones (.mt-actionbar): primero la principal */}
      {acciones.length > 0 || registrarDiagnostico ? (
        <ActionBar columna label="Acciones de la orden">
          {errorAccion && <Alert>{errorAccion}</Alert>}
          {registrarDiagnostico && (
            <Button fullWidth icon="search" onClick={() => setDiagnosticando(true)}>
              Registrar diagnóstico
            </Button>
          )}
          {acciones.map((a, i) => {
            const clave = `${a.a}-${a.label}`;
            // Las que piden escribir algo (motivo, repuesto) abren la hoja «Cambiar estado»
            if (a.observacion) {
              return (
                <Button
                  key={clave}
                  fullWidth
                  variant={i === 0 && !registrarDiagnostico ? 'primary' : 'secondary'}
                  onClick={() => setAccion(a)}
                >
                  {a.label}
                </Button>
              );
            }
            const texto = textoHold(a.label);
            const conTotal = a.mostrarTotal && orden.costoTotal > 0;
            return (
              <HoldButton
                key={clave}
                label={
                  conTotal ? `${texto.mantener} ${formatPesos(orden.costoTotal)}` : texto.mantener
                }
                doneLabel={texto.soltar}
                variant={i === 0 && !registrarDiagnostico ? 'primary' : 'soft'}
                loading={cambiar.isPending && cambiar.variables?.estado === a.a}
                disabled={cambiar.isPending}
                onConfirm={() => cambiarDirecto(a)}
                fullWidth
              />
            );
          })}
        </ActionBar>
      ) : (
        (orden.estado === 'cerrada' || orden.estado === 'cancelada') && (
          <ActionBar label="Estado de la orden">
            <p className="flex min-h-touch items-center justify-center gap-1.5 text-sm text-ink-muted">
              <Icon name="lock" size={16} />
              {orden.estado === 'cerrada'
                ? 'Orden cerrada · solo lectura'
                : 'Orden cancelada · solo lectura'}
            </p>
          </ActionBar>
        )
      )}

      <CambioEstadoSheet
        ordenPublicId={orden.publicId}
        estadoActual={orden.estado}
        accion={accion}
        total={orden.costoTotal}
        onClose={() => setAccion(null)}
      />
      <DiagnosticoSheet
        open={diagnosticando}
        orden={orden}
        onClose={() => setDiagnosticando(false)}
      />
      <ServicioSheet
        open={agregandoServicio}
        ordenPublicId={orden.publicId}
        onClose={() => setAgregandoServicio(false)}
      />
    </>
  );
}

/** Pestaña «Resumen»: progreso, cliente e ingreso */
function Resumen({ orden, rol }: { orden: OrdenDetalle; rol: Rol }) {
  const { etapa } = ESTADOS_ORDEN[orden.estado];
  const repuesto = orden.estado === 'pendiente_repuesto';
  const ultimaObs = orden.historial[0]?.observacion;
  return (
    <>
      <Card title="Progreso">
        {orden.estado === 'cancelada' ? (
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge estado="cancelada" />
            <span className="text-sm text-ink-muted">La orden se cerró sin reparación.</span>
          </div>
        ) : (
          <Stepper pasos={PASOS} actual={etapa} alerta={repuesto} />
        )}
        {repuesto && (
          <p className="mt-3 rounded-sm bg-accent-soft px-3 py-2 text-sm leading-5 text-accent-text">
            <span className="font-semibold">En pausa: </span>esperando repuesto. {ultimaObs ?? ''}
          </p>
        )}
      </Card>
      {rol !== 'cliente' && (
        <Card title="Cliente">
          <p className="font-semibold">{orden.moto.cliente.nombre}</p>
          <p className="text-sm leading-5 text-ink-muted">{orden.moto.cliente.telefono}</p>
        </Card>
      )}
      <Card title="Ingreso">
        <DataList
          items={[
            ['Motivo', orden.motivoIngreso],
            ['Ingreso', formatFecha(orden.fechaIngreso)],
            ['Kilometraje', `${km.format(orden.kilometrajeIngreso)} km`],
            ['Mecánico', orden.mecanico.nombre],
            orden.fechaEntrega ? ['Entregada', formatFecha(orden.fechaEntrega)] : null,
            orden.observaciones ? ['Observaciones', orden.observaciones] : null,
          ]}
        />
      </Card>
    </>
  );
}

/** Pestaña «Servicios»: líneas de la cotización y total */
function Servicios({
  orden,
  editable,
  onAgregar,
}: {
  orden: OrdenDetalle;
  editable: boolean;
  onAgregar: () => void;
}) {
  const quitar = useQuitarServicio(orden.publicId);
  return (
    <Card
      title="Servicios y repuestos"
      action={
        editable && (
          <Button variant="ghost" size="sm" icon="plus" onClick={onAgregar}>
            Agregar
          </Button>
        )
      }
    >
      {orden.servicios.length === 0 ? (
        <p className="text-sm leading-5 text-ink-muted">Aún no hay servicios en esta orden.</p>
      ) : (
        <>
          <ul className="flex flex-col">
            {orden.servicios.map((s) => (
              <li
                key={s.publicId}
                className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-ink"
                  aria-hidden="true"
                >
                  <Icon name="wrench" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p>{s.servicio.nombre}</p>
                  <p className="text-sm leading-5 text-ink-muted">
                    {s.cantidad} × {formatPesos(s.precioUnitario)}
                  </p>
                </div>
                <span className="font-semibold whitespace-nowrap">{formatPesos(s.subtotal)}</span>
                {editable && (
                  <IconButton
                    icon="trash"
                    size={18}
                    label={`Quitar ${s.servicio.nombre}`}
                    className="-mt-1.5 size-9"
                    disabled={quitar.isPending}
                    onClick={() =>
                      quitar.mutate(s.publicId, {
                        onError: (e) => toast(parseApiError(e).message, 'danger'),
                      })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-num text-[22px]">{formatPesos(orden.costoTotal)}</span>
          </div>
        </>
      )}
    </Card>
  );
}
