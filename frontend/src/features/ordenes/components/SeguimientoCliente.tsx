import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  BottomSheet,
  Button,
  Card,
  DataList,
  HoldButton,
  Note,
  Page,
  SelectCard,
  Textarea,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatDia, formatFecha, formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { OrdenDetalle } from '@/types';
import { accionesPara, type Accion } from '../estados';
import { useCambiarEstado } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, MOTIVOS_RECHAZO } from '../textos';
import { CalificarServicio } from './CalificarServicio';
import { ComprobanteServicio } from './ComprobanteServicio';
import { HistorialEstados } from './HistorialEstados';
import { CotizacionCard, EncabezadoSeguimiento, TarjetaTaller } from './SeguimientoPartes';
import { TarjetaRetiro } from './TarjetaRetiro';

const km = new Intl.NumberFormat('es-CO');

/**
 * HU-34, HU-49, HU-84 · Seguimiento del cliente (TrackingScreen del prototipo): isla oscura con
 * los 6 pasos, el total grande, la cotización, los datos de la orden, el contacto del taller,
 * el historial y, si espera su respuesta, aprobar o rechazar manteniendo presionado.
 */
export function SeguimientoCliente({
  orden,
  taller: tallerSesion,
}: {
  orden: OrdenDetalle;
  taller: string;
}) {
  const taller = orden.taller?.nombre ?? tallerSesion;
  const navigate = useNavigate();
  const cambiar = useCambiarEstado(orden.publicId);
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelada = orden.estado === 'cancelada';
  const esperando = orden.estado === 'esperando_aprobacion';
  const acciones = accionesPara(orden.estado, 'cliente_dueno');
  const aprobar = acciones.find((a) => a.a === 'aprobada');
  const rechazar = acciones.find((a) => a.a === 'cancelada');
  // HU-84: el motivo queda en la observación del cambio a «cancelada»
  const motivoCancelacion = cancelada
    ? orden.historial.find((h) => h.estadoNuevo === 'cancelada')?.observacion
    : null;
  // Cuando el cliente más lo necesita (decidir, recoger o una demora), el contacto va arriba
  const contactoArriba = esperando || orden.retiroPendiente || orden.atrasada;
  const contacto = orden.taller && <TarjetaTaller taller={orden.taller} orden={orden} />;

  async function aprobarOrden() {
    setError(null);
    try {
      await cambiar.mutateAsync({ estado: 'aprobada' });
      toast(`Orden: ${ETIQUETA_ESTADO.aprobada}`, 'success');
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <>
      <AppBar title={`Orden #${orden.numero}`} subtitle={taller} onBack={() => navigate(-1)} />

      <EncabezadoSeguimiento orden={orden} taller={taller} />

      <Page narrow pb={esperando ? 'actionbar' : undefined}>
        {orden.retiroPendiente && <TarjetaRetiro orden={orden} />}
        {cancelada && orden.fechaEntrega && (
          <Note icon="check">
            Retiraste tu moto el {formatFecha(orden.fechaEntrega).replace(/ de \d{4}$/, '')}.
          </Note>
        )}
        {cancelada && motivoCancelacion && (
          <Note icon="alert" tono="danger">
            <span className="font-semibold">Motivo de la cancelación: </span>
            {motivoCancelacion}
          </Note>
        )}
        {esperando && (
          <Note icon="clock" tono="accent">
            El taller espera tu respuesta para empezar. Si tienes dudas, escríbele antes de decidir.
          </Note>
        )}
        {contactoArriba && contacto}
        <CotizacionCard
          items={orden.servicios.map((s) => ({
            ...s,
            nombre: s.repuesto?.nombre ?? s.servicio?.nombre ?? 'Ítem',
          }))}
          diagnostico={orden.diagnostico}
          costoTotal={orden.costoTotal}
          cancelada={cancelada}
        />
        <Card title="Tu orden">
          <DataList
            items={[
              ['Motivo', orden.motivoIngreso],
              ['Ingreso', formatFecha(orden.fechaIngreso)],
              ['Kilometraje', `${km.format(orden.kilometrajeIngreso)} km`],
              ['Mecánico', orden.mecanico.nombre],
              !!orden.fechaEstimadaEntrega && [
                'Entrega estimada',
                <span key="e" className={orden.atrasada ? 'text-danger-text' : undefined}>
                  {formatDia(orden.fechaEstimadaEntrega)}
                  {orden.atrasada ? ' · atrasada' : ''}
                </span>,
              ],
              !!orden.fechaEntrega && ['Entregada', formatFecha(orden.fechaEntrega)],
            ]}
          />
        </Card>
        {/* HU-90 · Comprobante para imprimir o guardar en PDF */}
        <ComprobanteServicio orden={orden} />
        {/* HU-89 · Al entregar o cerrar la orden, el cliente califica el servicio */}
        {(orden.estado === 'entregada' || orden.estado === 'cerrada') && (
          <CalificarServicio orden={orden} taller={taller} />
        )}
        {!contactoArriba && contacto}
        {orden.historial.length > 0 && <HistorialEstados historial={orden.historial} />}
      </Page>

      {esperando && aprobar && (
        <ActionBar columna label="Responder la cotización">
          {error && <Alert>{error}</Alert>}
          <HoldButton
            label={`Mantén para aprobar ${formatPesos(orden.costoTotal)}`}
            doneLabel="Suelta para aprobar"
            loading={cambiar.isPending && !rechazando}
            disabled={cambiar.isPending}
            onConfirm={aprobarOrden}
            fullWidth
          />
          {rechazar && (
            <HoldButton
              label="Mantén para rechazar"
              doneLabel="Suelta para elegir el motivo"
              variant="soft"
              disabled={cambiar.isPending}
              onConfirm={() => setRechazando(true)}
              fullWidth
            />
          )}
        </ActionBar>
      )}

      {rechazar && (
        <RechazoSheet
          open={rechazando}
          accion={rechazar}
          ordenPublicId={orden.publicId}
          onClose={() => setRechazando(false)}
        />
      )}
    </>
  );
}

/** Hoja «Rechazar la cotización»: motivo obligatorio y comentario opcional */
function RechazoSheet({
  open,
  accion,
  ordenPublicId,
  onClose,
}: {
  open: boolean;
  accion: Accion;
  ordenPublicId: string;
  onClose: () => void;
}) {
  const cambiar = useCambiarEstado(ordenPublicId);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);

  function cerrar() {
    setMotivo(null);
    setComentario('');
    setError(null);
    onClose();
  }

  async function enviar() {
    if (!motivo) return;
    setError(null);
    const extra = comentario.trim();
    try {
      await cambiar.mutateAsync({
        estado: accion.a,
        observacion: extra ? `${motivo}. ${extra}` : motivo,
      });
      toast('Rechazaste la cotización', 'success');
      cerrar();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <BottomSheet
      open={open}
      title="Rechazar la cotización"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Volver
          </Button>
          <HoldButton
            label="Mantén para rechazar"
            doneLabel="Suelta para rechazar"
            variant="danger"
            disabled={!motivo}
            loading={cambiar.isPending}
            onConfirm={enviar}
            className="min-h-13 flex-[1.6]! text-[15px]"
          />
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <p>El taller no hará el trabajo y te avisará cuando puedas recoger la moto.</p>
      <div className="flex flex-col gap-2">
        <p id="motivo-rechazo" className="text-sm leading-5 font-semibold">
          ¿Por qué la rechazas? <span className="text-danger-text">*</span>
        </p>
        <div role="radiogroup" aria-labelledby="motivo-rechazo" className="flex flex-col gap-2">
          {MOTIVOS_RECHAZO.map((m) => (
            <SelectCard key={m} checked={motivo === m} onSelect={() => setMotivo(m)}>
              {m}
            </SelectCard>
          ))}
        </div>
      </div>
      <Textarea
        label="Comentario para el taller (opcional)"
        rows={3}
        maxLength={900}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
    </BottomSheet>
  );
}
