import { Icon, Radio } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { RolInvitado } from '@/types';
import { ROL_INVITADO } from './mensaje';

const DETALLE: Record<RolInvitado, { icon: 'wrench' | 'settings'; texto: string }> = {
  mecanico: {
    icon: 'wrench',
    texto: 'Sus órdenes asignadas, diagnóstico, cambios de estado y consulta de inventario.',
  },
  admin: { icon: 'settings', texto: 'Acceso total, incluidos reportes, usuarios y plan.' },
};

/** Opción de rol con su explicación (RoleOption del prototipo) */
export function OpcionRol({
  rol,
  checked,
  onSelect,
}: {
  rol: RolInvitado;
  checked: boolean;
  onSelect: () => void;
}) {
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
        <Icon name={DETALLE[rol].icon} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{ROL_INVITADO[rol]}</span>
        <span className="block text-sm leading-5 text-ink-muted">{DETALLE[rol].texto}</span>
      </span>
    </button>
  );
}
