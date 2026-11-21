import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

export type KpiTono = 'primary' | 'success' | 'accent' | 'navy';

/**
 * Lectura grande (.mt-kpi del prototipo): etiqueta arriba, número en Michroma y una pista
 * debajo. `success` pinta el número en verde (ingresos); `accent` va en blanco con borde tinta
 * y un punto amarillo.
 */
export function KpiTile({
  label,
  value,
  hint,
  icon,
  tono = 'primary',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: IconName;
  tono?: KpiTono;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[108px] flex-col gap-2 rounded-md px-[18px] py-4',
        tono === 'accent' ? 'bg-bg ring-[1.5px] ring-ink ring-inset' : 'bg-surface-sunken',
        className,
      )}
    >
      <p className="flex items-center justify-between gap-2 text-sm leading-5 text-ink-muted">
        <span>{label}</span>
        {icon && <Icon name={icon} size={18} />}
        {tono === 'accent' && !icon && (
          <span
            aria-hidden="true"
            className="size-[9px] rounded-full bg-accent ring-4 ring-accent-soft"
          />
        )}
      </p>
      <p
        className={cn(
          'font-num text-[26px] leading-8 tracking-[-0.01em] tabular-nums',
          tono === 'success' ? 'text-success-text' : 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="-mt-1.5 text-sm leading-5 text-ink-muted">{hint}</p>}
    </div>
  );
}
