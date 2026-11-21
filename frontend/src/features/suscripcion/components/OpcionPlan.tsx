import { Icon, Radio } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPesos } from '@/lib/format';
import type { PlanTaller } from '@/types';
import { PLANES } from '../planes';

/** Opción de plan con lo que gana o pierde (RoleOption del prototipo) */
export function OpcionPlan({
  plan,
  texto,
  checked,
  onSelect,
}: {
  plan: PlanTaller;
  texto: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const p = PLANES[plan];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-[18px] bg-surface text-left text-ink',
        checked ? 'border-2 border-ink px-[15px] py-[11px]' : 'border border-border px-4 py-3',
      )}
    >
      <span className="mt-0.5">
        <Radio checked={checked} />
      </span>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg"
      >
        <Icon name={p.icon} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">
          {p.nombre} · {formatPesos(p.precio)}/mes
        </span>
        <span className="block text-sm leading-5 text-ink-muted">{texto}</span>
      </span>
    </button>
  );
}
