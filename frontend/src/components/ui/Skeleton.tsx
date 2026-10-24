import { cn } from '@/lib/cn';

/** Bloque gris que se muestra mientras cargan los datos. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-sm bg-surface-2', className)} aria-hidden="true" />
  );
}

/** Lista de tarjetas en carga (para listas de órdenes, clientes, motos...) */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md bg-surface-sunken p-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/5" />
        </div>
      ))}
    </div>
  );
}
