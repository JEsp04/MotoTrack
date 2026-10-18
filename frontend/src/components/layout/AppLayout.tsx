import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import { LogoMark } from './Logo';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** true para que solo se marque en la ruta exacta (por ejemplo el inicio) */
  end?: boolean;
  /** En computador va en el menú del avatar y no en las pestañas (por ejemplo, Perfil) */
  enMenuCuenta?: boolean;
}

export interface AppLayoutProps {
  items: NavItem[];
  user: { nombre: string; rolLabel: string; taller?: string };
  /** Botón principal de la barra superior en computador (admin: «Recibir moto») */
  accionPrincipal?: { to: string; label: string };
  onLogout: () => void;
}

function iniciales(nombre: string) {
  return (
    nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}

/**
 * Estructura de la app con sesión (HU-10, HU-44):
 * - Menos de 1024 px: barra inferior fija.
 * - Desde 1024 px: barra superior con las pestañas del rol, el botón principal y el
 *   menú del avatar (Perfil y «Cerrar sesión»).
 */
export function AppLayout({ items, user, accionPrincipal, onLogout }: AppLayoutProps) {
  const pestanas = items.filter((i) => !i.enMenuCuenta);
  const deCuenta = items.filter((i) => i.enMenuCuenta);

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only z-[70] rounded-sm bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>

      {/* Barra superior (computador) */}
      <header className="sticky top-0 z-30 hidden h-topnav items-center gap-5 border-b border-border bg-surface/80 px-6 backdrop-blur-xl backdrop-saturate-150 lg:flex">
        <Link to={items[0]?.to ?? '/'} className="flex shrink-0 items-center gap-2.5 rounded-sm">
          <LogoMark />
          <span className="max-w-48 truncate font-semibold">{user.taller ?? 'MotoTrack'}</span>
        </Link>
        <nav aria-label="Menú principal" className="min-w-0">
          <ul className="flex gap-0.5 overflow-x-auto rounded-full bg-surface-sunken p-1 [scrollbar-width:none]">
            {pestanas.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center rounded-full px-4 text-sm whitespace-nowrap',
                      'transition-[color,background-color] duration-150',
                      isActive
                        ? 'bg-surface font-semibold text-ink shadow-sm'
                        : 'font-medium text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {accionPrincipal && (
            <Link
              to={accionPrincipal.to}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary transition-transform duration-150 ease-out hover:bg-primary/88 active:scale-[0.97]"
            >
              <Icon name="plus" size={18} />
              {accionPrincipal.label}
            </Link>
          )}
          <MenuCuenta user={user} items={deCuenta} onLogout={onLogout} />
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-[1200px] pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+16px)] lg:px-8 lg:pb-12"
      >
        <Outlet />
      </main>

      {/* Barra inferior (celular y tableta) */}
      <nav
        aria-label="Menú principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <ul className="mx-auto flex h-bottom-nav max-w-xl">
          {items.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-full flex-col items-center justify-center gap-1 text-xs',
                    isActive ? 'font-semibold text-ink' : 'font-medium text-ink-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200',
                        isActive && 'bg-ink text-on-primary',
                      )}
                    >
                      <Icon name={item.icon} size={20} />
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

/** Avatar con el menú de la cuenta: nombre, rol, Perfil y «Cerrar sesión». */
function MenuCuenta({
  user,
  items,
  onLogout,
}: {
  user: AppLayoutProps['user'];
  items: NavItem[];
  onLogout: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Se cierra al cambiar de página
  const [ruta, setRuta] = useState(pathname);
  if (ruta !== pathname) {
    setRuta(pathname);
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: PointerEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label={`Cuenta de ${user.nombre}`}
        onClick={() => setAbierto((v) => !v)}
        className="flex size-10 items-center justify-center rounded-[13px] bg-surface-sunken text-sm font-semibold text-ink transition-transform duration-150 ease-out hover:bg-surface-2 active:scale-[0.95]"
      >
        {iniciales(user.nombre)}
      </button>
      {abierto && (
        <div className="absolute top-12 right-0 flex w-64 origin-top-right animate-pop flex-col gap-1 rounded-[20px] bg-surface p-3.5 shadow-sheet ring-1 ring-ink/6">
          <p className="truncate px-2 font-semibold">{user.nombre}</p>
          <p className="truncate px-2 pb-2 text-sm text-ink-muted">
            {user.rolLabel}
            {user.taller ? ` · ${user.taller}` : ''}
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-sm px-2 font-medium hover:bg-surface-sunken',
                  isActive && 'bg-surface-sunken font-semibold',
                )
              }
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex min-h-touch items-center justify-center gap-2 rounded-full bg-surface-sunken font-semibold text-ink transition-transform duration-150 ease-out hover:bg-surface-2 active:scale-[0.97]"
          >
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
