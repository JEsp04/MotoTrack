import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Interruptor de sí o no (.mt-switch del prototipo): texto a la izquierda y el riel a la
 * derecha. Toda la fila se puede tocar.
 */
export function Switch({
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      aria-describedby={hint ? `${id}-hint` : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex min-h-touch w-full items-center justify-between gap-3 text-left text-ink',
        className,
      )}
    >
      <span className="min-w-0">
        <span id={`${id}-label`} className="block text-[15px] leading-5 font-semibold">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="block text-sm leading-5 text-ink-muted">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none',
          checked ? 'bg-ink' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] size-[22px] rounded-full bg-bg transition-[left] duration-150 motion-reduce:transition-none',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </span>
    </button>
  );
}
