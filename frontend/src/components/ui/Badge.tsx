import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN, type Tono } from '@/lib/estados-orden';
import type { EstadoOrden } from '@/types';

const TONOS: Record<Tono, string> = {
  neutral: 'bg-surface-sunken text-ink',
  primary: 'bg-surface-2 text-ink',
  accent: 'bg-accent-soft text-accent-text',
  success: 'bg-success-soft text-success-text',
  danger: 'bg-danger-soft text-danger-text',
  ink: 'bg-ink text-on-primary',
};

const PUNTOS: Record<Tono, string> = {
  neutral: 'bg-border-strong',
  primary: 'bg-ink',
  accent: 'bg-accent',
  success: 'bg-success',
  danger: 'bg-danger',
  ink: 'bg-accent',
};

export function Badge({
  tono = 'neutral',
  dot = false,
  className,
  children,
}: {
  tono?: Tono;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pr-2.5 pl-2 text-xs font-semibold',
        TONOS[tono],
        className,
      )}
    >
      {dot && <span className={cn('size-2 rounded-full', PUNTOS[tono])} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Estado de una orden con su texto en español y su color (HU-09). */
export function StatusBadge({ estado, className }: { estado: EstadoOrden; className?: string }) {
  const { label, tono } = ESTADOS_ORDEN[estado];
  return (
    <Badge tono={tono} dot className={className}>
      {label}
    </Badge>
  );
}
