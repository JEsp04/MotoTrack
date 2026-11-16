import { Link } from 'react-router';
import { Icon, Initials, Skeleton } from '@/components/ui';
import { useMiTaller } from '../hooks/use-taller';

/**
 * HU-73 · Tarjeta del taller arriba de «Más»: nombre, dirección y horario.
 * Al tocarla se abren los datos del taller para editarlos.
 */
export function TarjetaTaller({ nombre }: { nombre: string }) {
  const taller = useMiTaller();
  const datos = taller.data;
  return (
    <Link
      to="/admin/taller"
      aria-label={`Datos del taller ${datos?.nombre ?? nombre}`}
      className="flex items-center gap-3 rounded-md bg-surface-sunken p-4 text-ink transition-colors duration-150 hover:bg-surface-2"
    >
      <Initials nombre={datos?.nombre ?? nombre} className="size-12!" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{datos?.nombre ?? nombre}</p>
        {taller.isPending ? (
          <Skeleton className="mt-1 h-4 w-40" />
        ) : (
          <>
            <p className="truncate text-sm leading-5 text-ink-muted">
              {datos?.direccion || 'Sin dirección'}
            </p>
            <p className="truncate text-sm leading-5 text-ink-muted">
              {datos?.horarioAtencion ||
                'Horario por defecto: lun a vie 8:00 a 18:00, sáb 8:00 a 12:00'}
            </p>
          </>
        )}
      </div>
      <span className="shrink-0 text-ink-muted">
        <Icon name="chevronRight" />
      </span>
    </Link>
  );
}
