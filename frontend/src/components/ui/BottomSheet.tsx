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
        className="absolute inset-0 animate-fade-in bg-ink/30"
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
        className="relative flex max-h-[90dvh] w-full animate-sheet-up flex-col rounded-t-lg bg-surface shadow-sheet focus:outline-none sm:max-w-lg sm:rounded-lg"
      >
        <div
          className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border sm:hidden"
          aria-hidden="true"
        />
        <header className="flex items-center gap-2 px-5 pt-3 pb-2 sm:pt-5">
          <h2 id={titleId} className="flex-1 text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex size-touch items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <footer className="flex gap-3 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] *:flex-1">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
