import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

type TonoAlerta = 'danger' | 'info' | 'success';

const ESTILOS: Record<TonoAlerta, { clase: string; icono: IconName }> = {
  danger: { clase: 'bg-danger-soft text-danger-text', icono: 'alert' },
  info: { clase: 'bg-surface-sunken text-ink', icono: 'info' },
  success: { clase: 'bg-success-soft text-success-text', icono: 'check' },
};

/** Mensaje en línea dentro de un formulario o tarjeta (por ejemplo, el error general de un envío). */
export function Alert({
  tono = 'danger',
  children,
  className,
}: {
  tono?: TonoAlerta;
  children: ReactNode;
  className?: string;
}) {
  const { clase, icono } = ESTILOS[tono];
  return (
    <div
      role={tono === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-sm px-4 py-3 text-sm font-medium',
        clase,
        className,
      )}
    >
      <Icon name={icono} size={20} className="mt-px shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
