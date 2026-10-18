import { Link } from 'react-router';
import { Icon, Plate, StatusBadge } from '@/components/ui';
import { formatFecha, formatPesos } from '@/lib/format';
import type { OrdenResumen, Rol } from '@/types';
import { rutaOrden } from '../estados';

/** Tarjeta de una orden en la lista (HU-30, HU-47). En 390 px la placa y el estado no se cortan. */
export function OrdenCard({ orden, rol }: { orden: OrdenResumen; rol: Rol }) {
  return (
    <Link
      to={rutaOrden(rol, orden.publicId)}
      className="flex h-full flex-col gap-3 rounded-md bg-surface-sunken p-4 transition-[transform,background-color] duration-150 ease-out hover:bg-surface-2 active:scale-[0.985]"
    >
      <span className="flex items-center gap-3">
        <Plate placa={orden.moto.placa} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {orden.moto.marca} {orden.moto.referencia}
          </span>
          <span className="block truncate text-sm text-ink-muted">
            {rol === 'cliente' ? orden.motivoIngreso : orden.moto.cliente.nombre}
          </span>
        </span>
        <Icon name="chevronRight" className="shrink-0 text-ink-muted" size={20} />
      </span>
      <span className="flex items-center justify-between gap-2">
        <StatusBadge estado={orden.estado} />
        <span className="font-num text-xs text-ink-muted">#{orden.numero}</span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm text-ink-muted">
        <span className="min-w-0 truncate">
          {rol === 'mecanico' ? orden.motivoIngreso : orden.mecanico.nombre} ·{' '}
          {formatFecha(orden.fechaIngreso)}
        </span>
        {orden.costoTotal > 0 && (
          <span className="font-num text-[13px] whitespace-nowrap text-ink">
            {formatPesos(orden.costoTotal)}
          </span>
        )}
      </span>
    </Link>
  );
}
