import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Estado vacío (.mt-empty del prototipo): ícono en círculo, título y texto centrados. */
export function EmptyState({
  icon = 'search',
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-ink-muted">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-surface-sunken text-ink">
        <Icon name={icon} size={26} />
      </span>
      <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {text && <p className="max-w-sm text-sm leading-5">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
