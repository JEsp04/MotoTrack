import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { AppLayout } from '@/components/layout';
import { ROL_LABEL, useSalir, useSession } from '@/features/auth';
import { useSuscripcion } from '@/features/suscripcion';
import type { Rol } from '@/types';
import { RequireRole } from './guards';
import { ACCION_PRINCIPAL, ENLACES_CUENTA, NAV_POR_ROL } from './nav';

/** Layout con sesión para un rol: guarda + menú de ese rol. */
export function RoleLayout({ rol }: { rol: Rol }) {
  return (
    <RequireRole roles={[rol]}>
      {rol === 'admin' ? (
        <RequierePlan>
          <RoleShell rol={rol} />
        </RequierePlan>
      ) : (
        <RoleShell rol={rol} />
      )}
    </RequireRole>
  );
}

/** Sin plan solo se puede pagar o ir a «Más» (ahí está «Cerrar sesión») */
const LIBRES_SIN_PLAN = ['/admin/suscripcion', '/admin/mas', '/admin/perfil'];

/**
 * HU-81 · No hay plan gratis: mientras el taller no tenga un plan pagado, el admin solo puede
 * estar en «Taller y suscripción», «Pago seguro» y «Más».
 */
function RequierePlan({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const datos = useSuscripcion();
  if (
    datos.isSuccess &&
    !datos.data.suscripcion &&
    !LIBRES_SIN_PLAN.some((ruta) => pathname.startsWith(ruta))
  ) {
    return <Navigate to="/admin/suscripcion" replace />;
  }
  return children;
}

function RoleShell({ rol }: { rol: Rol }) {
  const usuario = useSession((s) => s.usuario);
  const { salir } = useSalir();

  return (
    <AppLayout
      items={NAV_POR_ROL[rol]}
      user={{
        nombre: usuario?.nombre ?? '',
        rolLabel: ROL_LABEL[rol],
        taller: usuario?.taller.nombre,
      }}
      marca={rol === 'cliente' ? 'Portal del cliente' : (usuario?.taller.nombre ?? 'MotoTrack')}
      accionPrincipal={ACCION_PRINCIPAL[rol]}
      enlacesCuenta={ENLACES_CUENTA[rol]}
      onLogout={salir}
    />
  );
}
