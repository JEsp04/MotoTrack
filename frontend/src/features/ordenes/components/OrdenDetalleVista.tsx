import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  Button,
  Card,
  Dial,
  EmptyState,
  HoldButton,
  Plate,
  Skeleton,
  SkeletonList,
  StatusBadge,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { parseApiError } from '@/lib/api-error';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatFecha, formatFechaHora, formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { OrdenDetalle, Rol } from '@/types';
import { accionesPara, actorDe, ESTADOS_EDITABLES, type Accion, type Actor } from '../estados';
import { useCambiarEstado, useOrden, useQuitarServicio } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, MENSAJE_CLIENTE, textoHold } from '../textos';
import { CambioEstadoSheet } from './CambioEstadoSheet';
import { DiagnosticoSheet } from './DiagnosticoSheet';
import { ServicioSheet } from './ServicioSheet';

const km = new Intl.NumberFormat('es-CO');
const ROL: Record<Rol, string> = {
  admin: 'Administrador',
  mecanico: 'Mecánico',
  cliente: 'Cliente',
};

/** HU-31 · Detalle de la orden para los 3 roles, con solo las acciones que cada uno puede hacer */
export function OrdenDetalleVista({ publicId }: { publicId: string }) {
  const navigate = useNavigate();
  const usuario = useSession((s) => s.usuario);
  const orden = useOrden(publicId);
  const volver = () => navigate(-1);

  if (orden.isPending) {
    return (
      <>
        <AppBar title="Orden" onBack={volver} />
        <div className="flex flex-col gap-4 p-4 lg:px-0" role="status" aria-label="Cargando">
          <Skeleton className="h-32 w-full" />
          <SkeletonList rows={2} />
        </div>
      </>
    );
  }

  if (orden.isError || !usuario) {
    const e = parseApiError(orden.error);
    return (
      <>
        <AppBar title="Orden" onBack={volver} />
        <div className="p-4 lg:px-0">
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
        </div>
      </>
    );
  }

  return <Contenido orden={orden.data} actor={actorDe(usuario, orden.data)} rol={usuario.rol} />;
}

function Contenido({ orden, actor, rol }: { orden: OrdenDetalle; actor: Actor | null; rol: Rol }) {
  const navigate = useNavigate();
  const [accion, setAccion] = useState<Accion | null>(null);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const cambiar = useCambiarEstado(orden.publicId);

  const acciones = accionesPara(orden.estado, actor);
  const editable = ESTADOS_EDITABLES.includes(orden.estado);
  const puedeDiagnosticar = actor === 'mecanico_asignado' && editable;
  const puedeEditarServicios = editable && (actor === 'admin' || actor === 'mecanico_asignado');
  const mensaje = rol === 'cliente' ? MENSAJE_CLIENTE[orden.estado] : undefined;
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
        subtitle={`Ingresó el ${formatFecha(orden.fechaIngreso)}`}
        onBack={() => navigate(-1)}
        actions={<StatusBadge estado={orden.estado} />}
      />
      <div className="flex flex-col gap-5 p-4 lg:px-0">
        {mensaje && <Alert tono={mensaje.tono}>{mensaje.texto}</Alert>}
        {orden.estado === 'cerrada' && (
          <p className="text-sm text-ink-muted">Orden cerrada: solo lectura.</p>
        )}

        <section aria-label="Avance de la orden" className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl leading-snug font-semibold tracking-tight">
                {orden.moto.marca} {orden.moto.referencia} · {orden.moto.modelo}
              </p>
              <p className="truncate text-sm text-ink-muted">
                {rol !== 'cliente' && `${orden.moto.cliente.nombre}, `}
                {km.format(orden.kilometrajeIngreso)} km
              </p>
            </div>
            <Plate placa={orden.moto.placa} />
          </div>
          <Dial
            paso={paso}
            label={label}
            sub={`Con ${orden.mecanico.nombre.split(' ')[0]}`}
            alerta={orden.estado === 'pendiente_repuesto'}
          />
        </section>

        <Card className="flex flex-col gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            {rol !== 'cliente' && (
              <Dato
                titulo="Cliente"
                valor={`${orden.moto.cliente.nombre} · ${orden.moto.cliente.telefono}`}
              />
            )}
            <Dato titulo="Mecánico" valor={orden.mecanico.nombre} />
            <Dato titulo="Ingreso" valor={formatFechaHora(orden.fechaIngreso)} />
            <Dato
              titulo="Kilometraje al ingresar"
              valor={`${km.format(orden.kilometrajeIngreso)} km`}
            />
            {orden.fechaEntrega && (
              <Dato titulo="Entregada" valor={formatFechaHora(orden.fechaEntrega)} />
            )}
          </dl>
          <div>
            <h2 className="text-xs font-semibold text-ink-muted">Motivo de ingreso</h2>
            <p className="mt-1 whitespace-pre-line">{orden.motivoIngreso}</p>
          </div>
          {orden.observaciones && (
            <div>
              <h2 className="text-xs font-semibold text-ink-muted">Observaciones</h2>
              <p className="mt-1 whitespace-pre-line">{orden.observaciones}</p>
            </div>
          )}
        </Card>

        <section aria-labelledby="t-diagnostico" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="t-diagnostico" className="text-lg">
              Diagnóstico
            </h2>
            {puedeDiagnosticar && orden.diagnostico && (
              <Button variant="ghost" size="sm" onClick={() => setDiagnosticando(true)}>
                Editar diagnóstico
              </Button>
            )}
          </div>
          {orden.diagnostico ? (
            <Card className="flex flex-col gap-3">
              {orden.diagnostico.prioridad === 'urgente' && (
                <Badge tono="danger" className="self-start">
                  Urgente
                </Badge>
              )}
              <div>
                <h3 className="text-xs font-semibold text-ink-muted">Hallazgos</h3>
                <p className="mt-1 whitespace-pre-line">{orden.diagnostico.hallazgos}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-ink-muted">Trabajo recomendado</h3>
                <p className="mt-1 whitespace-pre-line">{orden.diagnostico.trabajoRecomendado}</p>
              </div>
              <p className="text-xs text-ink-muted">
                Por {orden.diagnostico.mecanico.nombre} ·{' '}
                {formatFecha(orden.diagnostico.actualizadoEn)}
              </p>
            </Card>
          ) : puedeDiagnosticar ? (
            <Card className="flex flex-col items-start gap-3">
              <p className="text-ink-muted">Revisa la moto y escribe lo que encontraste.</p>
              <Button icon="wrench" onClick={() => setDiagnosticando(true)}>
                Diagnosticar
              </Button>
            </Card>
          ) : (
            <p className="text-ink-muted">Todavía no hay diagnóstico.</p>
          )}
        </section>

        <section aria-labelledby="t-servicios" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="t-servicios" className="text-lg">
              Servicios y costo
            </h2>
            {puedeEditarServicios && (
              <Button
                variant="ghost"
                size="sm"
                icon="plus"
                onClick={() => setAgregandoServicio(true)}
              >
                Agregar servicio
              </Button>
            )}
          </div>
          <Servicios orden={orden} editable={puedeEditarServicios} />
        </section>

        <section aria-labelledby="t-historial" className="flex flex-col gap-3">
          <h2 id="t-historial" className="text-lg">
            Historial
          </h2>
          <ol className="flex flex-col gap-0" aria-label="Historial de estados">
            {orden.historial.map((h, i) => (
              <li key={`${h.creadoEn}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                <span className="relative flex w-3 justify-center" aria-hidden="true">
                  <span className="mt-1.5 size-3 rounded-full bg-ink" />
                  {i < orden.historial.length - 1 && (
                    <span className="absolute top-5 bottom-[-4px] w-0.5 bg-border" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge estado={h.estadoNuevo} />
                    <span className="text-xs text-ink-muted">{formatFechaHora(h.creadoEn)}</span>
                  </div>
                  <p className="mt-1 text-sm">
                    {h.usuario.nombre}{' '}
                    <span className="text-ink-muted">({ROL[h.usuario.rol]})</span>
                  </p>
                  {h.observacion && <p className="text-sm text-ink-muted">{h.observacion}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {acciones.length > 0 && (
          <div
            aria-label="Acciones de la orden"
            role="group"
            className="sticky bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-col gap-2 border-t border-border bg-surface/85 px-4 py-3 backdrop-blur-xl lg:bottom-0 lg:mx-0 lg:px-0"
          >
            {errorAccion && <Alert>{errorAccion}</Alert>}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:*:flex-1">
              {acciones.map((a) => {
                const clave = `${a.a}-${a.label}`;
                // Las que piden escribir algo (motivo, repuesto) abren la hoja primero
                if (a.observacion) {
                  return (
                    <Button
                      key={clave}
                      variant="secondary"
                      onClick={() => setAccion(a)}
                      className={a.variante === 'danger' ? 'text-danger-text' : undefined}
                    >
                      {a.label}
                    </Button>
                  );
                }
                const texto = textoHold(a.label);
                return (
                  <HoldButton
                    key={clave}
                    label={texto.mantener}
                    doneLabel={texto.soltar}
                    variant={a.variante === 'primary' ? 'primary' : 'soft'}
                    loading={cambiar.isPending && cambiar.variables?.estado === a.a}
                    disabled={cambiar.isPending}
                    onConfirm={() => cambiarDirecto(a)}
                    fullWidth
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CambioEstadoSheet
        ordenPublicId={orden.publicId}
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

function Servicios({ orden, editable }: { orden: OrdenDetalle; editable: boolean }) {
  const quitar = useQuitarServicio(orden.publicId);
  if (orden.servicios.length === 0) {
    return <p className="text-ink-muted">Aún no hay servicios en esta orden.</p>;
  }
  return (
    <Card flush>
      <ul className="divide-y divide-border">
        {orden.servicios.map((s) => (
          <li key={s.publicId} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.servicio.nombre}</p>
              <p className="text-sm text-ink-muted">
                {s.cantidad} × {formatPesos(s.precioUnitario)}
              </p>
            </div>
            <span className="font-num text-sm whitespace-nowrap">{formatPesos(s.subtotal)}</span>
            {editable && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Quitar ${s.servicio.nombre}`}
                loading={quitar.isPending && quitar.variables === s.publicId}
                onClick={() =>
                  quitar.mutate(s.publicId, {
                    onError: (e) => toast(parseApiError(e).message, 'danger'),
                  })
                }
              >
                Quitar
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="font-semibold">Total</span>
        <span className="font-num text-xl">{formatPesos(orden.costoTotal)}</span>
      </div>
    </Card>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-ink-muted">{titulo}</dt>
      <dd className="mt-1 break-words">{valor}</dd>
    </div>
  );
}
