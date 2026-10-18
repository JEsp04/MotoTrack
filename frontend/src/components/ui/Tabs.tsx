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
}

/** Pestañas con desplazamiento horizontal en celular y flechas del teclado. */
export function Tabs<T extends string>({ tabs, value, onChange, label }: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    onChange(tabs[next]!.id);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]"
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
              '-mb-px flex min-h-touch shrink-0 items-center gap-2 border-b-3 px-3 text-sm font-semibold whitespace-nowrap transition-colors',
              activa
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  activa ? 'bg-primary text-on-primary' : 'bg-surface-sunken text-ink-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
