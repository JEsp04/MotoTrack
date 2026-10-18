import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/components/ui';
import { HOME_POR_ROL, useSession } from '@/features/auth';
import type { Rol } from '@/types';

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-ink">
      <Spinner className="size-8" label="Cargando" />
    </div>
  );
}

/**
 * HU-22 · Deja pasar solo a usuarios con sesión y con uno de los roles permitidos.
 * - Mientras se revisa la sesión al abrir la app: pantalla de carga.
 * - Sin sesión: va a /login y, al ingresar, vuelve a la ruta pedida.
 * - Rol equivocado: va al inicio de su propio rol.
 * La seguridad real está en el backend; esto solo ordena la navegación.
 */
export function RequireRole({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { status, usuario } = useSession();
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status !== 'authenticated' || !usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!roles.includes(usuario.rol)) return <Navigate to={HOME_POR_ROL[usuario.rol]} replace />;
  return children;
}

/** Ingreso y registro: si ya hay sesión, lleva al inicio del rol. */
export function GuestOnly() {
  const { status, usuario } = useSession();
  if (status === 'checking') return <FullPageLoader />;
  if (status === 'authenticated' && usuario) {
    return <Navigate to={HOME_POR_ROL[usuario.rol]} replace />;
  }
  return <Outlet />;
}

/** "/" lleva al inicio del rol o al ingreso. */
export function HomeRedirect() {
  const { status, usuario } = useSession();
  if (status === 'checking') return <FullPageLoader />;
  return <Navigate to={usuario ? HOME_POR_ROL[usuario.rol] : '/login'} replace />;
}
