import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  BottomSheet,
  Button,
  Card,
  HoldButton,
  Note,
  Page,
  Plate,
  SelectCard,
  Textarea,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { OrdenDetalle } from '@/types';
import { accionesPara, type Accion } from '../estados';
import { useCambiarEstado } from '../hooks/use-ordenes';
import { ETIQUETA_ESTADO, MENSAJE_CLIENTE, MOTIVOS_RECHAZO } from '../textos';

/** «$ 132.000» → «$132.000», como el monto grande del prototipo */
const montoGrande = (n: number) => formatPesos(n).replace(/^\$\s/, '$');

/**
 * HU-34, HU-49 · Seguimiento del cliente (TrackingScreen del prototipo): isla oscura con los
 * 6 pasos, el total grande, la cotización y, si espera su respuesta, aprobar o rechazar
 * manteniendo presionado.
 */
export function SeguimientoCliente({ orden, taller }: { orden: OrdenDetalle; taller: string }) {
  const navigate = useNavigate();
  const cambiar = useCambiarEstado(orden.publicId);
  const [rechazando, setRechazando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paso, label } = ESTADOS_ORDEN[orden.estado];
  const cancelada = orden.estado === 'cancelada';
  const esperando = orden.estado === 'esperando_aprobacion';
  const acciones = accionesPara(orden.estado, 'cliente_dueno');
  const aprobar = acciones.find((a) => a.a === 'aprobada');
  const rechazar = acciones.find((a) => a.a === 'cancelada');
  const hayCotizacion = orden.servicios.length > 0;

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

      {/* Encabezado del cliente (.mt-cl-hero) */}
      <section aria-label="Seguimiento de tu moto" className="border-b border-border">
        <div className="mx-auto flex w-full max-w-form flex-col gap-1.5 px-4 pt-3.5 pb-5 lg:px-8">
          <div className="isla" role="status">
            <span className="p" aria-hidden="true">
              {orden.moto.placa.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              <b>{esperando ? 'Esperando tu aprobación' : label}</b>
              <small>{cancelada ? 'Sin reparación' : `Paso ${paso} de 6 en ${taller}`}</small>
              {!cancelada && (
                <div className="segs" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <i key={k} className={k < paso ? 'ok' : k === paso ? 'now' : undefined} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-5 text-ink-muted">
              Tu {orden.moto.marca} {orden.moto.referencia}
            </p>
            <Plate placa={orden.moto.placa} />
          </div>
          {orden.costoTotal > 0 && (
            <p
              className={cn(
                'font-num text-[40px] leading-[1.1] tracking-[-0.02em]',
                cancelada && 'text-ink-muted line-through',
              )}
            >
              {montoGrande(orden.costoTotal)}
            </p>
          )}
          <p className="text-[17px] leading-[1.4]">{MENSAJE_CLIENTE[orden.estado]?.texto}</p>
        </div>
      </section>

      <Page narrow pb={esperando ? 'actionbar' : undefined}>
        {esperando && (
          <Note icon="clock" tono="accent">
            El taller espera tu respuesta para empezar. Si tienes dudas, escríbele antes de decidir.
          </Note>
        )}
        {(hayCotizacion || orden.diagnostico) && (
          <Card
            title={cancelada ? 'Cotización rechazada' : 'Cotización'}
            action={
              <span className="text-sm text-ink-muted">
                {orden.servicios.length} {orden.servicios.length === 1 ? 'ítem' : 'ítems'}
              </span>
            }
          >
            {orden.diagnostico && (
              <p className="mb-2 rounded-[14px] bg-bg px-3 py-2 text-sm leading-5 text-ink-muted">
                <span className="font-semibold text-ink">Qué encontró el mecánico: </span>
                {orden.diagnostico.hallazgos}
              </p>
            )}
            <ul className="flex flex-col">
              {orden.servicios.map((s) => (
                <li
                  key={s.publicId}
                  className={cn(
                    'flex items-start gap-3 border-b border-border py-3 last:border-b-0',
                    cancelada && 'text-ink-muted',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p>{s.servicio.nombre}</p>
                    <p className="text-sm leading-5 text-ink-muted">
                      {s.cantidad} × {formatPesos(s.precioUnitario)}
                    </p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">{formatPesos(s.subtotal)}</span>
                </li>
              ))}
            </ul>
            {hayCotizacion && (
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-semibold">Total</span>
                <span className={cn('font-num text-[22px]', cancelada && 'line-through')}>
                  {formatPesos(orden.costoTotal)}
                </span>
              </div>
            )}
          </Card>
        )}
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
            className="min-h-[50px] flex-[1.6]! text-[15px]"
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
