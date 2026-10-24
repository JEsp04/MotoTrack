import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '@/components/ui';

/** Accesos del panel de ingreso (.mt-login-links del prototipo): lista gris de filas de 64 px */
export function AccesoLinks({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md bg-surface-sunken">{children}</div>
  );
}

export function AccesoLink({
  to,
  icon,
  titulo,
  texto,
}: {
  to: string;
  icon: IconName;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-2.5 text-ink last:border-b-0 hover:bg-surface-2"
    >
      <Icon name={icon} />
      <span className="flex flex-1 flex-col">
        <b className="font-semibold">{titulo}</b>
        <span className="text-sm leading-5 text-ink-muted">{texto}</span>
      </span>
      <Icon name="chevronRight" className="text-ink-muted" />
    </Link>
  );
}

/** Encabezado de cada pantalla del panel: título de 26 px y texto gris */
export function AccesoTitulo({
  titulo,
  texto,
  antes,
}: {
  titulo: string;
  texto?: string;
  antes?: string;
}) {
  return (
    <div>
      {antes && <p className="text-sm leading-5 text-ink-muted">{antes}</p>}
      <h1 className="mt-1 text-[26px] leading-[30px] font-semibold tracking-[-0.03em] first:mt-0">
        {titulo}
      </h1>
      {texto && <p className="mt-1 text-sm leading-5 text-ink-muted">{texto}</p>}
    </div>
  );
}
