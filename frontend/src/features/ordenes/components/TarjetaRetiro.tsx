import { DataList, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPesos } from '@/lib/format';
import type { OrdenDetalle } from '@/types';

/**
 * HU-66 · Tarjeta de retiro del cliente (PickupCard del prototipo).
 * Lista para recoger, o «Recoge tu moto» si la orden se canceló sin reparación.
 * Los pagos, la dirección y el horario del prototipo se omiten: la app aún no tiene esos datos.
 */
export function TarjetaRetiro({ orden }: { orden: OrdenDetalle }) {
  const reparada = orden.estado === 'lista_entrega';
  const codigo = orden.codigoRetiro;
  return (
    <section
      aria-label={reparada ? 'Lista para recoger' : 'Recoge tu moto'}
      className="overflow-hidden rounded-md bg-surface-sunken"
    >
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          reparada ? 'bg-success-soft' : 'bg-surface-sunken',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-11 flex-none items-center justify-center rounded-full',
            reparada ? 'bg-success text-on-primary' : 'bg-ink text-bg',
          )}
        >
          <Icon name={reparada ? 'check' : 'moto'} size={24} stroke={reparada ? 3 : 2} />
        </span>
        <div>
          <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">
            {reparada ? 'Lista para recoger' : 'Recoge tu moto'}
          </h2>
          <p className="text-sm leading-5 text-ink-muted">
            {reparada
              ? 'Reparación terminada y probada en ruta.'
              : 'No se hizo ninguna reparación.'}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {codigo && (
          <div className="rounded-[18px] border-2 border-dashed border-border-strong p-3 text-center">
            <p className="text-sm leading-5 text-ink-muted">Código de retiro</p>
            <p
              aria-label={`Código ${codigo.split('').join(' ')}`}
              className="pl-[.2em] font-num text-[40px] leading-[48px] tracking-[-0.01em] tabular-nums"
            >
              {codigo}
            </p>
            <p className="text-sm leading-5 text-ink-muted">Muéstralo al llegar</p>
          </div>
        )}
        {reparada && <DataList items={[['A pagar', formatPesos(orden.costoTotal)]]} />}
      </div>
    </section>
  );
}
