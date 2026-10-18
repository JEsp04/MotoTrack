import { cn } from '@/lib/cn';
import { formatPlaca } from '@/lib/format';

/** Placa amarilla de moto colombiana. */
export function Plate({
  placa,
  size = 'md',
  className,
}: {
  placa: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap border-ink bg-plate font-num tracking-[0.12em] text-ink',
        size === 'sm'
          ? 'rounded-[5px] border-[1.5px] px-1.5 pt-[3px] pb-0.5 text-[11px]'
          : 'rounded-[7px] border-2 px-2.5 pt-1 pb-[3px] text-sm',
        className,
      )}
      aria-label={`Placa ${placa.split('').join(' ')}`}
    >
      {formatPlaca(placa)}
    </span>
  );
}
