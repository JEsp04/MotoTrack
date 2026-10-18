import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Botones de acción, fijos abajo */
  footer?: ReactNode;
}

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hoja inferior en celular y diálogo centrado desde 640 px.
 * Se cierra con Escape o tocando el fondo; mantiene el foco adentro y lo
 * devuelve al botón que la abrió.
 */
export function BottomSheet({ open, title, onClose, children, footer }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const primero = panel?.querySelector<HTMLElement>(ENFOCABLES);
    (primero ?? panel)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(ENFOCABLES));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/32"
        onClick={onClose}
        data-testid="sheet-backdrop"
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full animate-sheet-up flex-col rounded-t-lg bg-surface shadow-sheet focus:outline-none sm:w-[520px] sm:animate-pop sm:rounded-lg"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong sm:hidden"
          aria-hidden="true"
        />
        <header className="flex items-center justify-between py-2 pr-2 pl-5">
          <h2 id={titleId} className="text-lg leading-6 font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-touch items-center justify-center rounded-full text-ink transition-transform duration-150 ease-out active:scale-[0.94] active:bg-surface-sunken"
            aria-label="Cerrar"
          >
            <Icon name="close" size={22} />
          </button>
        </header>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pt-1 pb-4">{children}</div>
        {footer && (
          <footer className="flex gap-3 border-t border-border px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] *:flex-1">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
