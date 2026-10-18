import { Link } from 'react-router';
import { Button, Card, Plate, StatusBadge } from '@/components/ui';
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

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Plate placa={moto.placa} />
          <p className="mt-2 truncate font-semibold">
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
        <div className="flex flex-wrap items-center gap-2 rounded-sm bg-surface-sunken px-3 py-2 text-sm">
          {enlaceOrden ? (
            <Link
              to={enlaceOrden(moto.ordenActiva.publicId)}
              className="font-semibold text-ink underline"
            >
              En el taller · Orden #{moto.ordenActiva.numero}
            </Link>
          ) : (
            <span className="font-semibold">En el taller · Orden #{moto.ordenActiva.numero}</span>
          )}
          <StatusBadge estado={moto.ordenActiva.estado} />
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Sin órdenes abiertas</p>
      )}
    </Card>
  );
}
