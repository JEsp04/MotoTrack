import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Sin relleno interno (para listas que van de borde a borde) */
  flush?: boolean;
  /** Título de la tarjeta (h2 de 18 px), como .mt-card-head del prototipo */
  title?: ReactNode;
  /** Acción o dato a la derecha del título */
  action?: ReactNode;
}

/** Tarjeta gris sin sombra (.mt-card del prototipo) */
export function Card({ flush, title, action, className, children, ...rest }: CardProps) {
  return (
    <section className={cn('rounded-md bg-surface-sunken', !flush && 'p-4', className)} {...rest}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
