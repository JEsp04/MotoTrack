import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon = 'info',
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
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong/40 bg-surface px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-sunken text-ink">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="text-lg">{title}</h2>
      {text && <p className="max-w-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
