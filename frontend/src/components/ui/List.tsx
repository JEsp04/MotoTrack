import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

/** Lista gris con filas separadas por línea (.mt-list del prototipo) */
export function List({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      className={cn('flex flex-col overflow-hidden rounded-md bg-surface-sunken', className)}
    >
      {children}
    </ul>
  );
}

/** Iniciales en cuadro gris (.mt-initials del prototipo) */
export function Initials({ nombre, className }: { nombre: string; className?: string }) {
  const ini =
    nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-sm font-semibold text-ink',
        className,
      )}
    >
      {ini}
    </span>
  );
}

/** Ícono en cuadro blanco al inicio de una fila (.mt-lead-ico) */
export function LeadIcon({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface text-ink',
        className,
      )}
    >
      <Icon name={icon} />
    </span>
  );
}

export interface ListItemProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Iniciales, ícono o lo que vaya al inicio (por ejemplo, una placa) */
  initials?: string;
  icon?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Texto en rojo (por ejemplo, «Cerrar sesión») */
  danger?: boolean;
  /** Muestra la flecha cuando la fila se puede tocar */
  chevron?: boolean;
  to?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

/** Fila de una lista (.mt-li del prototipo): 64 px de alto, inicio, textos y final. */
export function ListItem({
  title,
  subtitle,
  initials,
  icon,
  leading,
  trailing,
  danger,
  chevron = true,
  to,
  onClick,
  'aria-label': ariaLabel,
}: ListItemProps) {
  const lead = initials ? (
    <Initials nombre={initials} />
  ) : icon ? (
    <LeadIcon icon={icon} />
  ) : (
    leading
  );
  const tocable = Boolean(to || onClick);
  const contenido = (
    <>
      {lead}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-semibold', danger && 'text-danger-text')}>
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-sm leading-5 text-ink-muted">{subtitle}</span>
        )}
      </span>
      {(trailing || (tocable && chevron)) && (
        <span className="flex shrink-0 items-center gap-2 text-ink-muted">
          {trailing}
          {tocable && chevron && <Icon name="chevronRight" />}
        </span>
      )}
    </>
  );
  const clases = cn(
    'flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left text-ink',
    tocable && 'transition-colors duration-150 hover:bg-surface-2',
  );
  return (
    <li className="border-b border-border last:border-b-0">
      {to ? (
        <Link to={to} className={clases} aria-label={ariaLabel}>
          {contenido}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={clases} aria-label={ariaLabel}>
          {contenido}
        </button>
      ) : (
        <div className={clases}>{contenido}</div>
      )}
    </li>
  );
}
