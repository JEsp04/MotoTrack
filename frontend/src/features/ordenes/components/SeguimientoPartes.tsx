import { ButtonLink, Card, Plate } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatDia, formatPesos } from '@/lib/format';
import { enlaceTelefono, enlaceWhatsApp } from '@/lib/whatsapp';
import type { ContactoTaller, EstadoOrden } from '@/types';
import { MENSAJE_CLIENTE } from '../textos';

/**
 * HU-90 · Piezas del seguimiento del cliente (TrackingScreen del prototipo) que comparten la
 * vista con sesión (`SeguimientoCliente`) y el enlace público `/s/:id` (`SeguimientoPublico`).
 */

/** Lo mínimo de una orden que necesita el encabezado y la tarjeta del taller */
export interface OrdenSeguimiento {
  numero: number;
  estado: EstadoOrden;
  costoTotal: number;
  fechaEstimadaEntrega: string | null;
  atrasada: boolean;
  moto: { placa: string; marca: string; referencia: string };
}

/** Una línea de la cotización */
export interface ItemCotizacion {
  publicId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** «$ 132.000» → «$132.000», como el monto grande del prototipo */
const montoGrande = (n: number) => formatPesos(n).replace(/^\$\s/, '$');

/** Línea pequeña de la isla: en qué va la orden (HU-84 distingue aprobada de en reparación) */
function detalleIsla(estado: EstadoOrden, paso: number, taller: string) {
  if (estado === 'cancelada') return 'Sin reparación';
  if (estado === 'aprobada') return 'En turno para iniciar la reparación';
  return `Paso ${paso} de 6 en ${taller}`;
}

/** Encabezado del cliente (.mt-cl-hero): isla con los 6 pasos, moto, placa, total y mensaje */
export function EncabezadoSeguimiento({
  orden,
  taller,
  propia = true,
}: {
  orden: OrdenSeguimiento;
  taller: string;
  /** Con sesión dice «Tu Yamaha NMAX»; en el enlace público, solo la moto */
  propia?: boolean;
}) {
  const { paso, label } = ESTADOS_ORDEN[orden.estado];
  const cancelada = orden.estado === 'cancelada';
  const esperando = orden.estado === 'esperando_aprobacion';
  return (
    <section aria-label="Seguimiento de tu moto" className="border-b border-border">
      <div className="mx-auto flex w-full max-w-form flex-col gap-1.5 px-4 pt-3.5 pb-5 lg:px-8">
        <div className="isla" role="status">
          <span className="p" aria-hidden="true">
            {orden.moto.placa.slice(0, 3)}
          </span>
          <div className="min-w-0 flex-1">
            <b>{esperando ? 'Esperando tu aprobación' : label}</b>
            <small>{detalleIsla(orden.estado, paso, taller)}</small>
            {/* HU-62 · Como en la isla de la landing: «Entrega estimada: 18 sep» */}
            {orden.fechaEstimadaEntrega &&
              !['entregada', 'cerrada', 'cancelada'].includes(orden.estado) && (
                <small>
                  Entrega estimada: {formatDia(orden.fechaEstimadaEntrega)}
                  {orden.atrasada ? ' · atrasada' : ''}
                </small>
              )}
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
            {propia ? 'Tu ' : ''}
            {orden.moto.marca} {orden.moto.referencia}
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
  );
}

/** Tarjeta «Cotización»: lo que encontró el mecánico, los ítems y el total */
export function CotizacionCard({
  items,
  diagnostico,
  costoTotal,
  cancelada,
}: {
  items: ItemCotizacion[];
  diagnostico: { hallazgos: string; trabajoRecomendado: string | null } | null;
  costoTotal: number;
  cancelada: boolean;
}) {
  if (items.length === 0 && !diagnostico) return null;
  return (
    <Card
      title={cancelada ? 'Cotización rechazada' : 'Cotización'}
      action={
        <span className="text-sm text-ink-muted">
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
        </span>
      }
    >
      {diagnostico && (
        <p className="mb-2 rounded-[14px] bg-bg px-3 py-2 text-sm leading-5 text-ink-muted">
          <span className="font-semibold text-ink">Qué encontró el mecánico: </span>
          {diagnostico.hallazgos}
        </p>
      )}
      {diagnostico?.trabajoRecomendado && (
        <p className="mb-2 rounded-[14px] bg-bg px-3 py-2 text-sm leading-5 text-ink-muted">
          <span className="font-semibold text-ink">Trabajo recomendado: </span>
          {diagnostico.trabajoRecomendado}
        </p>
      )}
      <ul className="flex flex-col">
        {items.map((s) => (
          <li
            key={s.publicId}
            className={cn(
              'flex items-start gap-3 border-b border-border py-3 last:border-b-0',
              cancelada && 'text-ink-muted',
            )}
          >
            <div className="min-w-0 flex-1">
              <p>{s.nombre}</p>
              <p className="text-sm leading-5 text-ink-muted">
                {s.cantidad} × {formatPesos(s.precioUnitario)}
              </p>
            </div>
            <span className="font-semibold whitespace-nowrap">{formatPesos(s.subtotal)}</span>
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="font-semibold">Total</span>
          <span className={cn('font-num text-[22px]', cancelada && 'line-through')}>
            {formatPesos(costoTotal)}
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * HU-84 · Tarjeta «Taller» del prototipo: nombre, dirección, horario y teléfono, con los
 * botones para escribir por WhatsApp (`wa.me`, sin costo) o llamar (`tel:`).
 */
export function TarjetaTaller({
  taller,
  orden,
}: {
  taller: ContactoTaller;
  orden: Pick<OrdenSeguimiento, 'numero' | 'moto'>;
}) {
  const mensaje = `Hola ${taller.nombre}, les escribo por la orden #${orden.numero} de mi ${orden.moto.marca} ${orden.moto.referencia} (${orden.moto.placa}).`;
  return (
    <Card title="Taller">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{taller.nombre}</p>
        {taller.direccion && <p className="text-sm leading-5 text-ink-muted">{taller.direccion}</p>}
        {taller.horarioAtencion && (
          <p className="text-sm leading-5 text-ink-muted">Horario: {taller.horarioAtencion}</p>
        )}
        <p className="text-sm leading-5 text-ink-muted">{taller.telefono}</p>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <ButtonLink
          href={enlaceWhatsApp(taller.telefono, mensaje)}
          externo
          icon="message"
          className="sm:flex-1"
        >
          Escribir por WhatsApp
        </ButtonLink>
        <ButtonLink
          href={enlaceTelefono(taller.telefono)}
          variant="light"
          icon="phone"
          className="sm:flex-1"
        >
          Llamar al taller
        </ButtonLink>
      </div>
    </Card>
  );
}
