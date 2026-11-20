import { cn } from '@/lib/cn';
import { Icon } from './Icon';

const VALORES = [1, 2, 3, 4, 5] as const;

/**
 * HU-89 · Calificación de 1 a 5 estrellas (amarillo de la placa). Sin `onChange` solo se
 * muestra; con `onChange`, cada estrella es un botón de 48 px para elegir.
 */
export function Estrellas({
  valor,
  onChange,
  size = 20,
  className,
}: {
  valor: number;
  onChange?: (valor: number) => void;
  size?: number;
  className?: string;
}) {
  if (!onChange) {
    return (
      <span
        role="img"
        aria-label={`${valor} de 5 estrellas`}
        className={cn('inline-flex items-center gap-0.5', className)}
      >
        {VALORES.map((v) => (
          <Icon
            key={v}
            name="star"
            size={size}
            fill={v <= valor ? 'currentColor' : 'none'}
            className={cn('shrink-0', v <= valor ? 'text-accent' : 'text-border-strong')}
          />
        ))}
      </span>
    );
  }
  return (
    <div
      role="radiogroup"
      aria-label="Calificación"
      className={cn('inline-flex items-center', className)}
    >
      {VALORES.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === valor}
          aria-label={`${v} ${v === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(v)}
          className="flex size-touch items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.9]"
        >
          <Icon
            name="star"
            size={size}
            fill={v <= valor ? 'currentColor' : 'none'}
            className={v <= valor ? 'text-accent' : 'text-border-strong'}
          />
        </button>
      ))}
    </div>
  );
}
