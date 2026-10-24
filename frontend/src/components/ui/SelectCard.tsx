import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Opción seleccionable con círculo (.mt-select-card del prototipo).
 * Va dentro de un contenedor con role="radiogroup".
 */
export function SelectCard({
  checked,
  onSelect,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-[18px] bg-surface text-left text-ink',
        checked ? 'border-2 border-ink px-[15px] py-[11px]' : 'border border-border px-4 py-3',
        className,
      )}
    >
      <Radio checked={checked} />
      {children}
    </button>
  );
}

/** El círculo de la opción (.mt-radio) */
export function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2',
        checked ? 'border-ink bg-accent' : 'border-border-strong',
      )}
    >
      {checked && <span className="size-2 rounded-full bg-ink" />}
    </span>
  );
}
