import { cn } from '@/lib/cn';

/** Selector de dos o más opciones en píldora (.mt-seg del prototipo), por ejemplo «Soy del taller / Soy cliente». */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string }>;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 rounded-[14px] bg-surface-sunken p-1"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={cn(
              'min-h-10 flex-1 rounded-[10px] text-sm font-semibold transition-colors duration-150',
              on ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
