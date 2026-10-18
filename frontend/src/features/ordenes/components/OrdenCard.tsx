import { Link } from 'react-router';
import { Icon, Plate, StatusBadge } from '@/components/ui';
import { formatFecha } from '@/lib/format';
import type { OrdenResumen, Rol } from '@/types';
import { rutaOrden } from '../estados';

/**
 * Tarjeta de una orden (OrderCard del prototipo): placa, moto y cliente; estado y número;
 * abajo el mecánico y la fecha de ingreso (la fecha estimada de entrega llega con su HU).
 */
export function OrdenCard({ orden, rol }: { orden: OrdenResumen; rol: Rol }) {
  return (
    <Link
      to={rutaOrden(rol, orden.publicId)}
      className="flex h-full flex-col gap-2.5 rounded-md bg-surface-sunken px-4 py-3.5 text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-surface-2 active:scale-[0.985]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-3">
          <Plate placa={orden.moto.placa} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">
              {orden.moto.marca} {orden.moto.referencia}
            </span>
            <span className="block truncate text-sm leading-5 text-ink-muted">
              {orden.moto.cliente.nombre}
            </span>
          </span>
        </span>
        <Icon name="chevronRight" className="text-ink-muted" />
      </span>
      <span className="flex items-center justify-between gap-2">
        <StatusBadge estado={orden.estado} />
        <span className="text-sm leading-5 text-ink-muted">#{orden.numero}</span>
      </span>
      <span className="flex items-center justify-between gap-2 border-t border-border pt-2.5 text-sm leading-5 text-ink-muted">
        <span className="inline-flex min-w-0 items-center gap-1">
          <Icon name="wrench" size={16} />
          <span className="truncate">{orden.mecanico.nombre}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          <Icon name="clock" size={16} />
          Ingresó {formatFecha(orden.fechaIngreso).replace(/ de \d{4}$/, '')}
        </span>
      </span>
    </Link>
  );
}
