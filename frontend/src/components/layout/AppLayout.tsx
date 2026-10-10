import { NavLink, Outlet } from 'react-router';
import { Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** true para que solo se marque en la ruta exacta (por ejemplo el inicio) */
  end?: boolean;
}

export interface AppLayoutProps {
  items: NavItem[];
  user: { nombre: string; rolLabel: string };
  onLogout: () => void;
}

/**
 * Estructura de la app con sesión (HU-10):
 * - Menos de 1024 px: barra inferior fija.
 * - Desde 1024 px: menú lateral de 240 px con el botón "Cerrar sesión" siempre visible.
 */
export function AppLayout({ items, user, onLogout }: AppLayoutProps) {
  return (
    <div className="min-h-dvh lg:pl-sidebar">
      <a
        href="#contenido"
        className="sr-only z-[70] rounded-md bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>

      {/* Menú lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col bg-brand-navy text-white lg:flex">
        <div className="px-6 pt-6 pb-8">
          <Logo tone="light" />
        </div>
        <nav aria-label="Menú principal" className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-touch items-center gap-3 rounded-md px-3 font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-brand-navy'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  <Icon name={item.icon} size={22} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="px-3 pb-3">
            <p className="truncate font-semibold">{user.nombre}</p>
            <p className="text-sm text-white/70">{user.rolLabel}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-touch w-full items-center gap-3 rounded-md px-3 font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" size={22} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main
        id="contenido"
        className="mx-auto w-full max-w-5xl pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+16px)] lg:px-8 lg:pb-10"
      >
        <Outlet />
      </main>

      {/* Barra inferior (celular y tableta) */}
      <nav
        aria-label="Menú principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex h-bottom-nav max-w-xl">
          {items.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors',
                    isActive ? 'text-primary-text' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full',
                        isActive && 'bg-primary-soft',
                      )}
                    >
                      <Icon name={item.icon} size={22} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
