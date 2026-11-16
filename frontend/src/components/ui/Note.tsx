import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

const TONOS = {
  neutral: { caja: 'bg-surface-sunken', icono: 'text-ink' },
  accent: { caja: 'bg-accent-soft', icono: 'text-accent-text' },
  danger: { caja: 'bg-danger-soft', icono: 'text-danger-text' },
} as const;

/** Nota con ícono (.mt-note del prototipo) */
export function Note({
  icon = 'info',
  tono = 'neutral',
  className,
  children,
}: {
  icon?: IconName;
  tono?: keyof typeof TONOS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-sm leading-5 text-ink',
        TONOS[tono].caja,
        className,
      )}
    >
      <Icon name={icon} className={cn('mt-px', TONOS[tono].icono)} />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
