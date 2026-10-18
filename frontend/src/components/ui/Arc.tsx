import { cn } from '@/lib/cn';

const TRAZO = 'M21.7 78.3A40 40 0 1 1 78.3 78.3';

export interface ArcProps {
  /** Pasos completos, de 0 a 6 */
  paso: number;
  /** Rojo cuando la orden está detenida (por ejemplo, falta un repuesto) */
  alerta?: boolean;
  /** Grosor del trazo */
  grosor?: number;
  className?: string;
}

/** Arco de progreso de 6 pasos, como el de un velocímetro. Decorativo: el texto va aparte. */
export function Arc({ paso, alerta = false, grosor = 7, className }: ArcProps) {
  const n = Math.max(0, Math.min(6, paso));
  return (
    <svg viewBox="0 0 100 100" className={cn('block', className)} aria-hidden="true">
      <path
        d={TRAZO}
        fill="none"
        strokeWidth={grosor}
        strokeLinecap="round"
        className="stroke-surface-2"
      />
      {n > 0 && (
        <path
          d={TRAZO}
          pathLength={6}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${n} 6`}
          className={cn(
            'transition-[stroke-dasharray] duration-700 ease-in-out',
            alerta ? 'stroke-danger' : 'stroke-ink',
          )}
        />
      )}
    </svg>
  );
}

export interface DialProps {
  /** Paso de 1 a 6; 0 si la orden se canceló */
  paso: number;
  /** Nombre del estado, por ejemplo «En reparación» */
  label: string;
  /** Texto pequeño debajo (por ejemplo, el mecánico) */
  sub?: string;
  alerta?: boolean;
  className?: string;
}

/** Dial grande del detalle de la orden: arco, número del paso y estado. */
export function Dial({ paso, label, sub, alerta, className }: DialProps) {
  const cancelada = paso === 0;
  return (
    <div
      role="img"
      aria-label={cancelada ? `Orden ${label.toLowerCase()}` : `Paso ${paso} de 6: ${label}`}
      className={cn('relative mx-auto h-[210px] w-[220px]', className)}
    >
      <Arc paso={paso} alerta={alerta} grosor={5} className="absolute inset-0 size-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 text-center">
        <span className="font-num text-[70px] leading-none">{cancelada ? '–' : paso}</span>
        <b className="mt-2 text-[15px] font-semibold">{label}</b>
        {sub && <small className="mt-0.5 text-[13px] text-ink-muted">{sub}</small>}
      </div>
    </div>
  );
}
