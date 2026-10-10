import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Sin relleno interno (para listas que van de borde a borde) */
  flush?: boolean;
}

export function Card({ flush, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface shadow-card',
        !flush && 'p-4',
        className,
      )}
      {...rest}
    />
  );
}
