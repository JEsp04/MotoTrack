import { Link } from 'react-router';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAvisosNoLeidos } from '../hooks/use-avisos';

/**
 * HU-70 · Campana con el número de avisos sin leer (.mt-iconbtn con .mt-topnav-count del
 * prototipo). Lleva a la pantalla «Avisos» del rol. Se actualiza cada 60 s.
 */
export function CampanaAvisos({ to, className }: { to: string; className?: string }) {
  const { data: n = 0 } = useAvisosNoLeidos();
  const etiqueta = n > 0 ? `Avisos, ${n} sin leer` : 'Avisos';
  return (
    <Link
      to={to}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        'relative inline-flex size-touch shrink-0 items-center justify-center rounded-full text-ink',
        'transition-[background-color,transform] duration-150 ease-out active:scale-[0.94] active:bg-surface-sunken',
        className,
      )}
    >
      <Icon name="bell" size={22} />
      {n > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 min-w-[18px] rounded-full bg-accent px-[5px] text-center text-[11px] leading-[18px] font-bold text-on-accent ring-2 ring-surface"
        >
          {n > 99 ? '99+' : n}
        </span>
      )}
    </Link>
  );
}
