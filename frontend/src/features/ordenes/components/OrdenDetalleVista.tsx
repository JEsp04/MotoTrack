import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  Badge,
  BottomSheet,
  Button,
  Card,
  DataList,
  Dial,
  EmptyState,
  HoldButton,
  Icon,
  IconButton,
  List,
  ListItem,
  Note,
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
import { ESTADOS_ORDEN, PASOS } from '@/lib/estados-orden';
import { formatDia, formatFecha, formatPesos } from '@/lib/format';
import { copiarTexto } from '@/lib/portapapeles';
import { toast } from '@/lib/toast';
import {
  enlaceTelefono,
  enlaceWhatsApp,
  mensajeCotizacionWhatsApp,
  mensajeOrdenWhatsApp,
} from '@/lib/whatsapp';
import type { OrdenDetalle, Rol } from '@/types';
import {
  accionesPara,
  actorDe,
  ESTADOS_AMPLIABLES,
  ESTADOS_EDITABLES,
  type Accion,
  type Actor,
} from '../estados';
import { useCambiarEstado, useOrden, useQuitarServicio } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, textoHold } from '../textos';
import { CambioEstadoSheet } from './CambioEstadoSheet';
import { DiagnosticoSheet } from './DiagnosticoSheet';
import { EntregaSheet } from './EntregaSheet';
import { ComprobanteServicio } from './ComprobanteServicio';
import { HistorialEstados } from './HistorialEstados';
import { RetiroSheet } from './RetiroSheet';
import { SeguimientoCliente } from './SeguimientoCliente';
import { ServicioSheet } from './ServicioSheet';

const km = new Intl.NumberFormat('es-CO');

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
  return (
    <Contenido
      orden={orden.data}
      actor={actorDe(usuario, orden.data)}
      rol={usuario.rol}
      taller={usuario.taller.nombre}
    />
  );
}

/**
 * Detalle igual a OrderDetailScreen del prototipo: encabezado con placa y dial, pestañas
 * Resumen, Diagnóstico, Servicios e Historial, y la barra de acciones con mantener presionado.
 */
function Contenido({
  orden,
  actor,
  rol,
  taller,
}: {
  orden: OrdenDetalle;
  actor: Actor | null;
  rol: Rol;
  taller: string;
}) {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [accion, setAccion] = useState<Accion | null>(null);
  const [menuAcciones, setMenuAcciones] = useState(false);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  const [retirando, setRetirando] = useState(false);
  const [cambiandoEntrega, setCambiandoEntrega] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const cambiar = useCambiarEstado(orden.publicId);

  const acciones = accionesPara(orden.estado, actor);
  const editable = ESTADOS_EDITABLES.includes(orden.estado);
  const puedeDiagnosticar = actor === 'mecanico_asignado' && editable;
  const puedeEditarServicios = editable && (actor === 'admin' || actor === 'mecanico_asignado');
  // HU-88 · Ítem adicional en una orden aprobada o en reparación (vuelve a pedir aprobación)
  const puedeAmpliar =
    ESTADOS_AMPLIABLES.includes(orden.estado) &&
    (actor === 'admin' || actor === 'mecanico_asignado');
  // HU-62 · El admin pone o cambia la entrega estimada mientras la moto siga en el taller
  const puedeCambiarEntrega =
    actor === 'admin' && !['entregada', 'cerrada', 'cancelada'].includes(orden.estado);
  // registrada → diagnosticada ocurre al guardar el diagnóstico, como en el prototipo
  const registrarDiagnostico = puedeDiagnosticar && orden.estado === 'registrada';
  const { paso, label } = ESTADOS_ORDEN[orden.estado];
  // HU-66: orden cancelada con la moto aún en el taller
  const retiroSinReparacion =
    actor === 'admin' && orden.estado === 'cancelada' && orden.retiroPendiente;
  const telefonoCliente = rol === 'admin' ? orden.moto.cliente.telefono?.trim() || null : null;
  // HU-85: un mecánico que abre la orden de un compañero solo la consulta
  const soloLecturaDeOtro = rol === 'mecanico' && actor !== 'mecanico_asignado';
  // HU-85: no se envía a aprobación una cotización sin ítems
  const sinItems = orden.servicios.length === 0;
  const bloqueaEnvio = (a: Accion) => a.a === 'esperando_aprobacion' && sinItems;

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
        actions={
          telefonoCliente ? (
            <IconButton icon="more" label="Más acciones" onClick={() => setMenuAcciones(true)} />
          ) : undefined
        }
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
                : orden.fechaEstimadaEntrega
                  ? `${orden.mecanico.nombre.split(' ')[0]}, entrega ${formatDia(orden.fechaEstimadaEntrega)}`
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
        {soloLecturaDeOtro && (
          <Note icon="lock">Orden asignada a {orden.mecanico.nombre} · solo lectura</Note>
        )}
        {pestana === 'resumen' && (
          <Resumen
            orden={orden}
            rol={rol}
            taller={taller}
            onCambiarEntrega={puedeCambiarEntrega ? () => setCambiandoEntrega(true) : undefined}
          />
        )}

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
            ampliable={puedeAmpliar}
            onAgregar={() => setAgregandoServicio(true)}
          />
        )}

        {pestana === 'historial' && <HistorialEstados historial={orden.historial} />}
      </Page>

      {/* Barra de acciones (.mt-actionbar): primero la principal */}
      {acciones.length > 0 || registrarDiagnostico ? (
        <ActionBar columna label="Acciones de la orden">
          {errorAccion && <Alert>{errorAccion}</Alert>}
          {acciones.some(bloqueaEnvio) && (
            <Note icon="alert" tono="accent">
              Agrega al menos un ítem en «Servicios» antes de enviar la cotización al cliente.
            </Note>
          )}
          {registrarDiagnostico && (
            <Button fullWidth icon="search" onClick={() => setDiagnosticando(true)}>
              Registrar diagnóstico
            </Button>
          )}
          {acciones.map((a, i) => {
            const clave = `${a.a}-${a.label}`;
            // Las que piden escribir algo (motivo, repuesto, código de retiro) abren la hoja
            if (a.observacion || a.pideCodigo) {
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
                disabled={cambiar.isPending || bloqueaEnvio(a)}
                onConfirm={() => cambiarDirecto(a)}
                fullWidth
              />
            );
          })}
        </ActionBar>
      ) : retiroSinReparacion ? (
        <ActionBar label="Acciones de la orden">
          <Button fullWidth variant="secondary" icon="moto" onClick={() => setRetirando(true)}>
            Registrar retiro sin reparación
          </Button>
        </ActionBar>
      ) : (
        (orden.estado === 'cerrada' || orden.estado === 'cancelada') && (
          <ActionBar label="Estado de la orden">
            <p className="flex min-h-touch items-center justify-center gap-1.5 text-sm text-ink-muted">
              <Icon name="lock" size={16} />
              {orden.estado === 'cerrada'
                ? 'Orden cerrada · solo lectura'
                : orden.fechaEntrega
                  ? 'Orden cancelada · moto retirada'
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
      <RetiroSheet
        open={retirando}
        ordenPublicId={orden.publicId}
        onClose={() => setRetirando(false)}
      />
      <EntregaSheet
        open={cambiandoEntrega}
        orden={orden}
        onClose={() => setCambiandoEntrega(false)}
      />
      <ServicioSheet
        open={agregandoServicio}
        ordenPublicId={orden.publicId}
        ampliacion={puedeAmpliar}
        onClose={() => setAgregandoServicio(false)}
      />
      {telefonoCliente && (
        <BottomSheet
          open={menuAcciones}
          title={`Orden #${orden.numero}`}
          onClose={() => setMenuAcciones(false)}
        >
          <List label="Más acciones de la orden">
            <ListItem
              icon="receipt"
              title="Compartir cotización"
              subtitle="Enviar hallazgos y total por WhatsApp"
              href={enlaceWhatsApp(telefonoCliente, mensajeCotizacionWhatsApp(orden, taller))}
              onClick={() => setMenuAcciones(false)}
            />
            {/* HU-84 · Respaldo en computador: copiar el mismo mensaje para pegarlo donde sea */}
            <ListItem
              icon="clipboard"
              title="Copiar mensaje"
              subtitle="Copiar la cotización para pegarla en otro chat"
              chevron={false}
              onClick={() => {
                setMenuAcciones(false);
                void copiarTexto(mensajeCotizacionWhatsApp(orden, taller), 'Cotización copiada');
              }}
            />
          </List>
        </BottomSheet>
      )}
    </>
  );
}

/** Pestaña «Resumen»: progreso, cliente e ingreso */
function Resumen({
  orden,
  rol,
  taller,
  onCambiarEntrega,
}: {
  orden: OrdenDetalle;
  rol: Rol;
  taller: string;
  onCambiarEntrega?: () => void;
}) {
  const { etapa } = ESTADOS_ORDEN[orden.estado];
  const repuesto = orden.estado === 'pendiente_repuesto';
  const ultimaObs = orden.historial[0]?.observacion;
  const telefono = rol === 'admin' ? orden.moto.cliente.telefono?.trim() || null : null;
  const sinStockCotizado = ['aprobada', 'en_reparacion'].includes(orden.estado)
    ? orden.servicios.filter((s) => s.repuesto && s.repuesto.stock < s.cantidad)
    : [];
  return (
    <>
      {sinStockCotizado.length > 0 && (
        <Note icon="alert" tono="accent">
          Stock insuficiente para {sinStockCotizado.map((s) => s.repuesto?.nombre).join(', ')}. La
          reparación no se bloquea; si aún falta al reparar, usa «Falta repuesto».
        </Note>
      )}
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
      {rol === 'admin' && (
        <Card title="Cliente">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{orden.moto.cliente.nombre}</p>
              {telefono && <p className="text-sm leading-5 text-ink-muted">{telefono}</p>}
            </div>
            {telefono && (
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={enlaceTelefono(telefono)}
                  aria-label="Llamar"
                  title="Llamar"
                  className="inline-flex size-touch shrink-0 items-center justify-center rounded-full bg-surface text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-surface-2 active:scale-[0.94]"
                >
                  <Icon name="phone" size={22} />
                </a>
                <a
                  href={enlaceWhatsApp(telefono, mensajeOrdenWhatsApp(orden, taller))}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Escribir por WhatsApp"
                  title="Escribir por WhatsApp"
                  className="inline-flex size-touch shrink-0 items-center justify-center rounded-full bg-surface text-ink transition-[background-color,transform] duration-150 ease-out hover:bg-surface-2 active:scale-[0.94]"
                >
                  <Icon name="message" size={22} />
                </a>
              </div>
            )}
          </div>
          {orden.codigoRetiro && (
            <div className="mt-3">
              {/* HU-66: si el cliente no tiene cuenta, el admin le da el código por teléfono */}
              <DataList
                items={[
                  [
                    'Código de retiro',
                    <span key="c" className="font-num tracking-[.2em]">
                      {orden.codigoRetiro}
                    </span>,
                  ],
                ]}
              />
            </div>
          )}
        </Card>
      )}
      <Card
        title="Ingreso"
        action={
          onCambiarEntrega && (
            <Button variant="ghost" size="sm" icon="calendar" onClick={onCambiarEntrega}>
              {orden.fechaEstimadaEntrega ? 'Cambiar entrega' : 'Poner entrega'}
            </Button>
          )
        }
      >
        <DataList
          items={[
            ['Motivo', orden.motivoIngreso],
            ['Ingreso', formatFecha(orden.fechaIngreso)],
            orden.fechaEstimadaEntrega
              ? [
                  'Entrega estimada',
                  <span className={orden.atrasada ? 'text-danger-text' : undefined}>
                    {formatDia(orden.fechaEstimadaEntrega)}
                    {orden.atrasada ? ' · atrasada' : ''}
                  </span>,
                ]
              : null,
            ['Kilometraje', `${km.format(orden.kilometrajeIngreso)} km`],
            ['Mecánico', orden.mecanico.nombre],
            orden.fechaEntrega
              ? [
                  orden.estado === 'cancelada' ? 'Retirada' : 'Entregada',
                  formatFecha(orden.fechaEntrega),
                ]
              : null,
            orden.observaciones ? ['Observaciones', orden.observaciones] : null,
          ]}
        />
      </Card>
      {/* HU-90 · Comprobante para imprimir o guardar en PDF */}
      <ComprobanteServicio orden={orden} />
    </>
  );
}

/** Pestaña «Servicios»: líneas de la cotización y total */
function Servicios({
  orden,
  editable,
  ampliable,
  onAgregar,
}: {
  orden: OrdenDetalle;
  editable: boolean;
  /** HU-88 · Se puede agregar un ítem adicional (no quitar) */
  ampliable: boolean;
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
            {orden.servicios.map((s) => {
              const nombreItem = s.repuesto?.nombre ?? s.servicio?.nombre ?? 'Ítem';
              const esRepuesto = Boolean(s.repuesto);
              const mostrarStock =
                esRepuesto && !['entregada', 'cerrada', 'cancelada'].includes(orden.estado);
              return (
                <li
                  key={s.publicId}
                  className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-ink"
                    aria-hidden="true"
                  >
                    <Icon name={esRepuesto ? 'box' : 'wrench'} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>{nombreItem}</p>
                    <p className="text-sm leading-5 text-ink-muted">
                      {s.cantidad} × {formatPesos(s.precioUnitario)}
                      {mostrarStock && s.repuesto && (
                        <>
                          {' · '}
                          {s.repuesto.stock === 0 ? 'Agotado' : `${s.repuesto.stock} en stock`}
                        </>
                      )}
                    </p>
                  </div>
                  {mostrarStock && s.repuesto && s.repuesto.stock < s.cantidad && (
                    <Badge tono={s.repuesto.stock === 0 ? 'danger' : 'accent'}>
                      {s.repuesto.stock === 0 ? 'Agotado' : 'Bajo'}
                    </Badge>
                  )}
                  <span className="font-semibold whitespace-nowrap">{formatPesos(s.subtotal)}</span>
                  {editable && (
                    <IconButton
                      icon="trash"
                      size={18}
                      label={`Quitar ${nombreItem}`}
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
              );
            })}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-num text-[22px]">{formatPesos(orden.costoTotal)}</span>
          </div>
        </>
      )}
      {ampliable && (
        <div className="mt-4 flex flex-col gap-3">
          <Note tono="accent" icon="alert">
            ¿Encontraste otro daño? Agrégalo aquí. La orden volverá a «Esperando aprobación» y el
            cliente debe aprobar el nuevo total antes de seguir.
          </Note>
          <Button variant="secondary" icon="plus" onClick={onAgregar}>
            Agregar ítem adicional
          </Button>
        </div>
      )}
    </Card>
  );
}
