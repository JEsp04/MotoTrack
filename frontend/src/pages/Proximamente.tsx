import type { ReactNode } from 'react';
import { AppBar, EmptyState, type IconName } from '@/components/ui';

/** Pantalla provisional mientras se construye la historia de usuario indicada. */
export function Proximamente({
  title,
  subtitle,
  hu,
  icon,
  text,
  actions,
}: {
  title: string;
  subtitle?: string;
  hu: string;
  icon: IconName;
  text: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <AppBar title={title} subtitle={subtitle} actions={actions} />
      <div className="p-4 lg:px-0">
        <EmptyState icon={icon} title="En construcción" text={`${text} (${hu})`} />
      </div>
    </>
  );
}
