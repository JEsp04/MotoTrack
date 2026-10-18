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
      className="flex max-w-full gap-0.5 self-start overflow-x-auto rounded-full bg-surface-sunken p-1 [scrollbar-width:none]"
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
              'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap',
              'transition-[color,background-color] duration-150',
              activa
                ? 'bg-surface font-semibold text-ink shadow-sm'
                : 'font-medium text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold',
                  activa ? 'bg-accent text-ink' : 'bg-surface-2 text-ink-muted',
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
