import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface AppBarProps {
  title: string;
  subtitle?: string;
  /** Si se pasa, muestra la flecha para volver */
  onBack?: () => void;
  actions?: ReactNode;
}

/** Encabezado de cada pantalla. Fijo arriba en celular. */
export function AppBar({ title, subtitle, onBack, actions }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pt-6 lg:backdrop-blur-none">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex size-touch items-center justify-center rounded-full text-ink hover:bg-neutral-soft"
          aria-label="Volver"
        >
          <Icon name="back" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl lg:text-2xl">{title}</h1>
        {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
