import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Contenido de una pantalla (.mt-page del prototipo): 16 px de margen en celular, 32 px en
 * computador y 1200 px de ancho máximo. `narrow` (formularios y detalle) deja 760 px.
 * `pb` deja espacio para el botón flotante o la barra de acciones.
 */
export function Page({
  narrow,
  pb,
  className,
  children,
}: {
  narrow?: boolean;
  pb?: 'fab' | 'actionbar';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-4 p-4 lg:p-8',
        narrow ? 'max-w-form' : 'max-w-[1200px]',
        pb === 'fab' && 'pb-24 lg:pb-28',
        pb === 'actionbar' && 'pb-44 lg:pb-44',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Barra de acciones fija abajo (.mt-actionbar del prototipo). Las pantallas que la usan
 * esconden la barra de navegación inferior.
 */
export function ActionBar({
  columna,
  label = 'Acciones',
  children,
}: {
  /** Botones uno debajo del otro (.mt-actionbar-col) */
  columna?: boolean;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-[696px]',
          columna ? 'flex-col gap-2' : 'gap-3 *:min-w-0 *:flex-auto',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Lista de dato y valor (.mt-dl del prototipo) */
export function DataList({
  items,
}: {
  items: Array<[string, ReactNode] | false | null | undefined>;
}) {
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm leading-5">
      {items
        .filter((x): x is [string, ReactNode] => Boolean(x))
        .map(([dt, dd]) => (
          <div key={dt} className="contents">
            <dt className="text-ink-muted">{dt}</dt>
            <dd className="m-0 text-right font-semibold break-words">{dd}</dd>
          </div>
        ))}
    </dl>
  );
}
