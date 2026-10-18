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
    <div className="flex flex-col items-center gap-3 rounded-md bg-surface-sunken px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-sm bg-surface text-ink">
        <Icon name={icon} size={26} />
      </span>
      <h2 className="text-lg">{title}</h2>
      {text && <p className="max-w-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
