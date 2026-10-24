import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatches } from 'react-router';
import { Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import { LogoMark } from './Logo';

export interface NavItem {
  to: string;
  label: string;
  /** Texto en la barra superior del computador, si es distinto (por ejemplo «Taller») */
  labelEscritorio?: string;
  icon: IconName;
  /** true para que solo se marque en la ruta exacta (por ejemplo el inicio) */
  end?: boolean;
  /** Dónde aparece: en las dos barras (por defecto), solo en celular o solo en computador */
  donde?: 'celular' | 'escritorio';
}

export interface AppLayoutProps {
  items: NavItem[];
  /** Nombre que va junto al logo: el taller, o «Portal del cliente» */
  marca: string;
  user: { nombre: string; rolLabel: string; taller?: string };
  /** Botón principal de la barra superior en computador (admin: «Recibir moto») */
  accionPrincipal?: { to: string; label: string };
  /** Enlaces del menú del avatar (por ejemplo, «Mi cuenta») */
  enlacesCuenta?: Array<{ to: string; label: string; icon: IconName }>;
  onLogout: () => void;
}

/** Las rutas con `handle: { sinNav: true }` (detalle y formularios) esconden la barra inferior */
function useSinNav() {
  return useMatches().some((m) => (m.handle as { sinNav?: boolean } | undefined)?.sinNav);
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
 * Estructura de la app con sesión (HU-10, HU-44), igual al prototipo:
 * - Menos de 1024 px: barra inferior de vidrio.
 * - Desde 1024 px: barra superior con la marca, las pestañas del rol, el botón principal y el
 *   menú del avatar (Mi cuenta y «Cerrar sesión»).
 */
export function AppLayout({
  items,
  marca,
  user,
  accionPrincipal,
  enlacesCuenta = [],
  onLogout,
}: AppLayoutProps) {
  const sinNav = useSinNav();
  const pestanas = items.filter((i) => i.donde !== 'celular');
  const inferiores = items.filter((i) => i.donde !== 'escritorio');

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only z-[70] rounded-sm bg-surface px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>

      {/* Barra superior (computador) */}
      <header className="sticky top-0 z-30 hidden h-topnav items-center gap-[18px] border-b border-border bg-surface/78 px-6 backdrop-blur-[18px] backdrop-saturate-[1.4] lg:flex">
        <Link to={items[0]?.to ?? '/'} className="flex shrink-0 items-center gap-2.5 rounded-sm">
          <LogoMark className="size-[30px]" />
          <span className="max-w-56 truncate font-semibold">{marca}</span>
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
                      'flex items-center rounded-full px-3.5 py-2 text-sm whitespace-nowrap',
                      'transition-[color,background-color] duration-150',
                      isActive
                        ? 'bg-surface font-semibold text-ink shadow-sm'
                        : 'font-medium text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {item.labelEscritorio ?? item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative ml-auto flex items-center gap-2.5">
          {accionPrincipal && (
            <Link
              to={accionPrincipal.to}
              className="inline-flex min-h-touch items-center rounded-full bg-primary px-[22px] text-sm font-semibold whitespace-nowrap text-on-primary transition-transform duration-150 ease-out hover:bg-primary/88 active:scale-[0.97]"
            >
              {accionPrincipal.label}
            </Link>
          )}
          <MenuCuenta user={user} enlaces={enlacesCuenta} onLogout={onLogout} />
        </div>
      </header>

      <main
        id="contenido"
        className={cn(
          'w-full',
          !sinNav && 'pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] lg:pb-0',
        )}
      >
        <Outlet />
      </main>

      {/* Barra inferior (celular y tableta) */}
      {!sinNav && (
        <nav
          aria-label="Menú principal"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/78 pb-[env(safe-area-inset-bottom)] backdrop-blur-[18px] backdrop-saturate-[1.4] lg:hidden"
        >
          <ul className="mx-auto flex h-bottom-nav max-w-xl">
            {inferiores.map((item) => (
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
                          'flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-200',
                          isActive && 'bg-ink text-on-primary',
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
      )}
    </div>
  );
}

/** Avatar con el menú de la cuenta (.mt-topnav-menu del prototipo). */
function MenuCuenta({
  user,
  enlaces,
  onLogout,
}: {
  user: AppLayoutProps['user'];
  enlaces: NonNullable<AppLayoutProps['enlacesCuenta']>;
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
        className="flex size-10 items-center justify-center rounded-[13px] bg-surface-sunken text-sm font-semibold text-ink transition-transform duration-150 ease-out active:scale-[0.95]"
      >
        {iniciales(user.nombre)}
      </button>
      {abierto && (
        <div className="absolute top-[50px] right-0 flex w-60 origin-top-right animate-pop flex-col gap-1 rounded-[20px] bg-surface p-3.5 shadow-sheet ring-1 ring-ink/6">
          <p className="truncate font-semibold">{user.nombre}</p>
          <p className="truncate text-sm leading-5 text-ink-muted">
            {user.rolLabel}
            {user.taller ? ` · ${user.taller}` : ''}
          </p>
          {enlaces.length > 0 && (
            <div className="mt-2 flex flex-col">
              {enlaces.map((e) => (
                <NavLink
                  key={e.to}
                  to={e.to}
                  className="flex min-h-11 items-center gap-2.5 rounded-sm px-1 text-sm font-medium hover:bg-surface-sunken"
                >
                  <Icon name={e.icon} size={18} />
                  <span className="flex-1">{e.label}</span>
                  <Icon name="chevronRight" size={16} className="text-ink-muted" />
                </NavLink>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="mt-2.5 flex min-h-touch items-center justify-center gap-2 rounded-full bg-surface-sunken px-3 text-sm font-semibold text-ink transition-transform duration-150 ease-out hover:bg-surface-2 active:scale-[0.97]"
          >
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
