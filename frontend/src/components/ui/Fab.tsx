import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

const CLASES =
  'fixed right-4 bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+16px)] z-20 flex h-14 items-center gap-2 rounded-full bg-ink pr-5 pl-4 font-semibold text-on-primary shadow-sheet transition-transform duration-150 ease-out active:scale-[0.97] lg:right-8 lg:bottom-8';

/** Botón flotante abajo a la derecha (.mt-fab del prototipo), por ejemplo «Nueva orden». */
export function Fab({
  label,
  icon = 'plus',
  to,
  onClick,
  className,
}: {
  label: string;
  icon?: IconName;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const contenido = (
    <>
      <Icon name={icon} size={22} />
      {label}
    </>
  );
  return to ? (
    <Link to={to} className={cn(CLASES, className)}>
      {contenido}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cn(CLASES, className)}>
      {contenido}
    </button>
  );
}
