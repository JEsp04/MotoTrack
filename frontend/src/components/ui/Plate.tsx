import { cn } from '@/lib/cn';
import { formatPlaca } from '@/lib/format';

/**
 * Placa amarilla de moto colombiana, como .mt-plate del prototipo.
 * `lg` es la del encabezado del detalle y de la ficha de la moto.
 */
export function Plate({
  placa,
  size = 'md',
  className,
}: {
  placa: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center border-ink bg-plate font-num leading-none tracking-[0.12em] whitespace-nowrap text-ink',
        size === 'lg'
          ? 'rounded-lg border-2 px-3 pt-1.5 pb-[5px] text-lg'
          : 'rounded-[6px] border-[1.5px] px-2 pt-1 pb-[3px] text-xs',
        className,
      )}
      aria-label={`Placa ${placa.split('').join(' ')}`}
    >
      {formatPlaca(placa)}
    </span>
  );
}
