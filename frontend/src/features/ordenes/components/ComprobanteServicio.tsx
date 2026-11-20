import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { useMiTaller } from '@/features/taller';
import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import { formatFecha, formatFechaHora, formatPesos } from '@/lib/format';
import type { DatosTaller, OrdenDetalle } from '@/types';

const km = new Intl.NumberFormat('es-CO');

/**
 * HU-90 · Botón «Imprimir comprobante» y el recibo que se imprime (o se guarda en PDF desde el
 * diálogo del navegador). El recibo solo existe mientras se imprime: mientras está en la página,
 * `index.css` oculta la app y queda el formato con taller, cliente, moto, diagnóstico, ítems y total.
 */
export function ComprobanteServicio({ orden }: { orden: OrdenDetalle }) {
  // Los datos completos del taller (NIT, dirección, correo) ya cargados antes de imprimir
  const taller = useMiTaller().data;
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    if (!imprimiendo) return;
    const terminar = () => setImprimiendo(false);
    window.addEventListener('afterprint', terminar);
    window.print();
    return () => window.removeEventListener('afterprint', terminar);
  }, [imprimiendo]);

  return (
    <>
      <Button variant="secondary" icon="receipt" fullWidth onClick={() => setImprimiendo(true)}>
        Imprimir comprobante
      </Button>
      {imprimiendo && createPortal(<Recibo orden={orden} taller={taller} />, document.body)}
    </>
  );
}

function Recibo({ orden, taller }: { orden: OrdenDetalle; taller?: DatosTaller }) {
  const nombreTaller = taller?.nombre ?? orden.taller?.nombre ?? '';
  const contacto = [
    taller?.nit && `NIT ${taller.nit}`,
    taller?.direccion ?? orden.taller?.direccion,
    taller?.telefono ?? orden.taller?.telefono,
    taller?.email,
  ].filter(Boolean);

  return (
    <article
      aria-label={`Comprobante de la orden #${orden.numero}`}
      className="comprobante bg-surface p-6 text-sm leading-5 text-ink print:p-0"
    >
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div>
          <p className="text-xl leading-7 font-semibold">{nombreTaller}</p>
          {contacto.map((linea) => (
            <p key={linea as string}>{linea}</p>
          ))}
        </div>
        <div className="text-right">
          <p className="font-semibold">Comprobante de servicio</p>
          <p className="font-num text-lg">#{orden.numero}</p>
          <p className="text-ink-muted">Emitido el {formatFechaHora(new Date())}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b border-border py-4">
        <div>
          <p className="font-semibold">Cliente</p>
          <p>{orden.moto.cliente.nombre}</p>
          {orden.moto.cliente.telefono && <p>{orden.moto.cliente.telefono}</p>}
        </div>
        <div>
          <p className="font-semibold">Moto</p>
          <p>
            {orden.moto.marca} {orden.moto.referencia} {orden.moto.modelo}
            {orden.moto.color ? ` · ${orden.moto.color}` : ''}
          </p>
          <p>
            Placa <span className="font-num">{orden.moto.placa}</span> ·{' '}
            {km.format(orden.kilometrajeIngreso)} km
          </p>
        </div>
        <div>
          <p className="font-semibold">Orden</p>
          <p>Estado: {ESTADOS_ORDEN[orden.estado].label}</p>
          <p>Motivo: {orden.motivoIngreso}</p>
          <p>Mecánico: {orden.mecanico.nombre}</p>
        </div>
        <div>
          <p className="font-semibold">Fechas</p>
          <p>Ingreso: {formatFecha(orden.fechaIngreso)}</p>
          {orden.fechaEntrega && <p>Entrega: {formatFecha(orden.fechaEntrega)}</p>}
        </div>
      </section>

      {orden.diagnostico && (
        <section className="border-b border-border py-4">
          <p className="font-semibold">Diagnóstico</p>
          <p className="whitespace-pre-line">{orden.diagnostico.hallazgos}</p>
          <p className="mt-2 font-semibold">Trabajo realizado o recomendado</p>
          <p className="whitespace-pre-line">{orden.diagnostico.trabajoRecomendado}</p>
        </section>
      )}

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="py-2 font-semibold">Descripción</th>
            <th className="py-2 font-semibold">Tipo</th>
            <th className="py-2 text-right font-semibold">Cant.</th>
            <th className="py-2 text-right font-semibold">Valor unitario</th>
            <th className="py-2 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {orden.servicios.length === 0 && (
            <tr>
              <td colSpan={5} className="py-3 text-ink-muted">
                Sin repuestos ni servicios registrados.
              </td>
            </tr>
          )}
          {orden.servicios.map((s) => (
            <tr key={s.publicId} className="border-b border-border">
              <td className="py-2">{s.repuesto?.nombre ?? s.servicio?.nombre ?? 'Ítem'}</td>
              <td className="py-2">{s.repuesto ? 'Repuesto' : 'Servicio'}</td>
              <td className="py-2 text-right">{s.cantidad}</td>
              <td className="py-2 text-right">{formatPesos(s.precioUnitario)}</td>
              <td className="py-2 text-right">{formatPesos(s.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-3 text-right font-semibold">
              Total
            </td>
            <td className="pt-3 text-right font-num text-lg">{formatPesos(orden.costoTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-8 text-ink-muted">
        Gracias por confiar en {nombreTaller}. Comprobante generado con MotoTrack; no es una factura
        electrónica.
      </p>
    </article>
  );
}
