import { Link } from 'react-router';
import { Card, Icon, Plate, StatusBadge } from '@/components/ui';
import { formatFecha, formatPesos } from '@/lib/format';
import type { OrdenResumen, Rol } from '@/types';
import { rutaOrden } from '../estados';

/** Tarjeta de una orden en la lista (HU-30). En 390 px la placa y el estado no se cortan. */
export function OrdenCard({ orden, rol }: { orden: OrdenResumen; rol: Rol }) {
  return (
    <Link
      to={rutaOrden(rol, orden.publicId)}
      className="group block rounded-md focus-visible:outline-offset-4"
    >
      <Card className="flex flex-col gap-2 transition-colors group-hover:border-primary">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-bold">#{orden.numero}</span>
          <Plate placa={orden.moto.placa} size="sm" />
          <StatusBadge estado={orden.estado} className="ml-auto" />
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {orden.moto.marca} {orden.moto.referencia}
            </p>
            <p className="truncate text-sm text-ink-muted">{orden.motivoIngreso}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {rol !== 'cliente' && <>{orden.moto.cliente.nombre} · </>}
              {rol !== 'mecanico' && <>Mecánico: {orden.mecanico.nombre} · </>}
              {formatFecha(orden.fechaIngreso)}
              {orden.costoTotal > 0 && <> · {formatPesos(orden.costoTotal)}</>}
            </p>
          </div>
          <Icon name="chevronRight" className="shrink-0 text-ink-muted" size={20} />
        </div>
      </Card>
    </Link>
  );
}
