import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /**
   * `chips`: filtros en píldora con conteo (.mt-fchip del prototipo).
   * `underline`: pestañas a lo ancho con raya inferior (.mt-tabs del prototipo).
   */
  variant?: 'chips' | 'underline';
  className?: string;
}

/** Pestañas con desplazamiento horizontal en celular y flechas del teclado. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  variant = 'chips',
  className,
}: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next]!.id);
  }

  const chips = variant === 'chips';

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex overflow-x-auto [scrollbar-width:none]',
        chips ? '-mx-4 gap-2 px-4 py-0.5' : 'border-b border-border bg-surface/78',
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const activa = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'shrink-0 text-sm font-semibold whitespace-nowrap',
              chips
                ? cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 transition-colors duration-150',
                    activa
                      ? 'border-ink bg-ink text-on-primary'
                      : 'border-border bg-surface text-ink',
                  )
                : cn(
                    'min-h-touch flex-auto border-b-3 px-2',
                    activa ? 'border-ink text-ink' : 'border-transparent text-ink-muted',
                  ),
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="text-xs opacity-80">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
