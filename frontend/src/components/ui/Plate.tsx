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
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm border-2 border-brand-navy bg-plate font-display font-bold tracking-wider text-brand-navy',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
      aria-label={`Placa ${placa.split('').join(' ')}`}
    >
      {formatPlaca(placa)}
    </span>
  );
}
