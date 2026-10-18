import { Link } from 'react-router';
import { Plate, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPesos } from '@/lib/format';
import type { OrdenResumen } from '@/types';
import { MENSAJE_CLIENTE } from '../textos';

/** Tarjeta de una orden abierta en el inicio del cliente (.mt-corder del prototipo) */
export function OrdenClienteCard({ orden, taller }: { orden: OrdenResumen; taller: string }) {
  const espera = orden.estado === 'esperando_aprobacion';
  const lista = orden.estado === 'lista_entrega';
  return (
    <Link
      to={`/cliente/ordenes/${orden.publicId}`}
      aria-label={`Orden #${orden.numero}: ${orden.moto.marca} ${orden.moto.referencia}`}
      className={cn(
        'flex w-full flex-col gap-3 rounded-[22px] text-left text-ink transition-transform duration-150 ease-out active:scale-[0.99]',
        espera
          ? 'border-2 border-ink bg-bg p-[15px]'
          : lista
            ? 'border-2 border-success bg-surface-sunken p-[15px]'
            : 'bg-surface-sunken p-4',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm leading-5 text-ink-muted">
            Orden #{orden.numero} · {taller}
          </p>
          <p className="truncate text-lg leading-6 font-semibold tracking-[-0.01em]">
            {orden.moto.marca} {orden.moto.referencia}
          </p>
        </div>
        <Plate placa={orden.moto.placa} />
      </div>
      <StatusBadge estado={orden.estado} size="lg" />
      <p>{MENSAJE_CLIENTE[orden.estado]?.texto}</p>
      <span
        className={cn(
          'flex min-h-touch items-center justify-center rounded-full px-6 font-semibold',
          espera
            ? 'bg-primary text-on-primary'
            : lista
              ? 'bg-success text-on-primary'
              : 'bg-bg text-ink',
        )}
      >
        {espera ? `Revisar cotización · ${formatPesos(orden.costoTotal)}` : 'Ver seguimiento'}
      </span>
    </Link>
  );
}
