import { Link } from 'react-router';
import { Button, Plate, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Moto } from '@/types';

const km = new Intl.NumberFormat('es-CO');

/** Tarjeta de una moto: placa, marca, referencia y, si está en el taller, su estado (HU-27). */
export function MotoCard({
  moto,
  onEditar,
  enlaceOrden,
}: {
  moto: Moto;
  onEditar?: (moto: Moto) => void;
  /** Ruta al detalle de la orden abierta, si se puede abrir */
  enlaceOrden?: (ordenPublicId: string) => string;
}) {
  const detalles = [
    String(moto.modelo),
    moto.cilindraje ? `${moto.cilindraje} cc` : null,
    moto.color,
    `${km.format(moto.kilometraje)} km`,
  ].filter(Boolean);
  const esperaRespuesta = moto.ordenActiva?.estado === 'esperando_aprobacion';

  return (
    <div
      className={cn(
        'flex h-full flex-col gap-3 rounded-md p-4 sm:p-5',
        esperaRespuesta ? 'bg-surface shadow-sheet ring-[1.5px] ring-ink' : 'bg-surface-sunken',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Plate placa={moto.placa} />
          <p className="mt-2.5 truncate text-lg font-semibold tracking-tight">
            {moto.marca} {moto.referencia}
          </p>
          <p className="text-sm text-ink-muted">{detalles.join(' · ')}</p>
        </div>
        {onEditar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditar(moto)}
            aria-label={`Editar la moto ${moto.placa}`}
          >
            Editar
          </Button>
        )}
      </div>
      {moto.ordenActiva ? (
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {enlaceOrden ? (
              <Link
                to={enlaceOrden(moto.ordenActiva.publicId)}
                className="font-semibold text-ink underline decoration-border-strong underline-offset-4"
              >
                En el taller · Orden #{moto.ordenActiva.numero}
              </Link>
            ) : (
              <span className="font-semibold">En el taller · Orden #{moto.ordenActiva.numero}</span>
            )}
            <StatusBadge estado={moto.ordenActiva.estado} />
          </div>
          {esperaRespuesta && enlaceOrden && (
            <Link
              to={enlaceOrden(moto.ordenActiva.publicId)}
              className="inline-flex min-h-touch items-center justify-center rounded-full bg-primary px-6 font-semibold text-on-primary transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Revisar y aprobar
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-auto text-sm text-ink-muted">Sin órdenes abiertas</p>
      )}
    </div>
  );
}
