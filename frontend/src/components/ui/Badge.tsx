import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ESTADOS_ORDEN, type Tono } from '@/lib/estados-orden';
import type { EstadoOrden } from '@/types';
import { Icon, type IconName } from './Icon';

/** Colores de .mt-tone-* del prototipo */
const TONOS: Record<Tono, string> = {
  neutral: 'bg-surface-sunken text-ink',
  primary: 'bg-surface-2 text-ink',
  accent: 'bg-accent-soft text-accent-text',
  success: 'bg-success-soft text-success-text',
  danger: 'bg-danger-soft text-danger-text',
  ink: 'bg-ink text-on-primary',
};

/** Chip (.mt-chip): píldora de 12 px con ícono opcional */
export function Badge({
  tono = 'neutral',
  icon,
  size = 'md',
  className,
  children,
}: {
  tono?: Tono;
  icon?: IconName;
  size?: 'md' | 'lg';
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
        size === 'lg'
          ? 'py-1 pr-3 pl-2.5 text-sm leading-6'
          : 'py-[3px] pr-2.5 pl-2 text-xs leading-5',
        TONOS[tono],
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 16 : 14} stroke={2.4} />}
      {children}
    </span>
  );
}

/** Estado de una orden con su ícono, texto y color, como StatusChip del prototipo. */
export function StatusBadge({
  estado,
  size,
  className,
}: {
  estado: EstadoOrden;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const { label, tono, icono } = ESTADOS_ORDEN[estado];
  return (
    <Badge tono={tono} icon={icono} size={size} className={className}>
      {label}
    </Badge>
  );
}
