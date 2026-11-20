import { useState } from 'react';
import { Icon } from './Icon';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

/**
 * Selector numérico con botones de 48 px (.mt-qty del prototipo). HU-87: el número también se
 * puede escribir (teclado numérico en celular); al salir del campo se ajusta al mínimo y máximo.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  label = 'Cantidad',
}: QuantityStepperProps) {
  // Mientras escribe, el campo puede quedar vacío; el valor real sigue siendo `value`
  const [borrador, setBorrador] = useState<string | null>(null);
  const puedeBajar = value > min;
  const puedeSubir = max === undefined || value < max;
  const ajustar = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n));

  function escribir(texto: string) {
    const digitos = texto.replace(/\D/g, '').slice(0, 6);
    setBorrador(digitos);
    if (digitos !== '') onChange(ajustar(Number(digitos)));
  }

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
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={borrador ?? String(value)}
        onChange={(e) => escribir(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => setBorrador(null)}
        className="h-touch w-16 bg-surface px-1 text-center font-sans text-lg font-semibold tabular-nums text-ink outline-none focus-visible:bg-surface-sunken"
      />
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
