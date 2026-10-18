import type { ReactNode } from 'react';
import { IconButton } from './IconButton';

export interface AppBarProps {
  title: string;
  subtitle?: string;
  /** Si se pasa, muestra la flecha para volver */
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Encabezado de cada pantalla (.mt-appbar del prototipo): barra de vidrio de 60 px con
 * título de 18 px y subtítulo gris. Fija arriba; en computador, debajo de la barra superior.
 */
export function AppBar({ title, subtitle, onBack, actions }: AppBarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-1 border-b border-border bg-surface/78 py-1 pr-1 pl-2 backdrop-blur-[18px] backdrop-saturate-[1.4] lg:top-topnav lg:pl-6">
      {onBack && <IconButton icon="back" label="Volver" onClick={onBack} />}
      <div className={onBack ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pl-2'}>
        <h1 className="truncate text-lg leading-6 font-semibold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="truncate text-sm leading-5 text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
