import { Icon } from './Icon';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

/** Selector numérico con botones de 48 px (.mt-qty del prototipo). */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  label = 'Cantidad',
}: QuantityStepperProps) {
  const puedeBajar = value > min;
  const puedeSubir = max === undefined || value < max;

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-sm border border-border-strong bg-surface"
    >
      <button
        type="button"
        aria-label="Menos"
        disabled={!puedeBajar}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-touch items-center justify-center bg-surface-sunken text-ink transition-transform duration-150 ease-out active:scale-[0.95] disabled:opacity-40"
      >
        <Icon name="minus" size={18} />
      </button>
      <span
        aria-live="polite"
        className="min-w-14 px-2 text-center font-sans text-lg font-semibold tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Más"
        disabled={!puedeSubir}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        className="flex size-touch items-center justify-center bg-surface-sunken text-ink transition-transform duration-150 ease-out active:scale-[0.95] disabled:opacity-40"
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
