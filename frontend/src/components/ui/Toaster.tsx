import { cn } from '@/lib/cn';
import { useToastStore, type TonoToast } from '@/lib/toast';
import { Icon, type IconName } from './Icon';

const ESTILOS: Record<TonoToast, { clase: string; icono: IconName }> = {
  info: { clase: 'bg-ink text-white', icono: 'info' },
  success: { clase: 'bg-success-text text-white', icono: 'check' },
  danger: { clase: 'bg-danger text-white', icono: 'alert' },
};

/** Avisos flotantes. Se monta una vez en App; se usan con toast('…') desde lib/toast. */
export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-bottom-nav)+12px)] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tono === 'danger' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-md animate-sheet-up items-center gap-3 rounded-md py-2 pr-2 pl-4 shadow-sheet',
            ESTILOS[t.tono].clase,
          )}
        >
          <Icon name={ESTILOS[t.tono].icono} size={20} />
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/15"
            aria-label="Cerrar aviso"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
