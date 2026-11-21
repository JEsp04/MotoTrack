import { AppLayout } from '@/components/layout';
import { ROL_LABEL, useSalir, useSession } from '@/features/auth';
import { CampanaAvisos } from '@/features/avisos';
import { useTemaDeLaApp } from '@/lib/tema';
import type { Rol } from '@/types';
import { RequireRole } from './guards';
import { ACCION_PRINCIPAL, ENLACES_CUENTA, NAV_POR_ROL } from './nav';

/** Layout con sesión para un rol: guarda + menú de ese rol. */
export function RoleLayout({ rol }: { rol: Rol }) {
  return (
    <RequireRole roles={[rol]}>
      <RoleShell rol={rol} />
    </RequireRole>
  );
}

function RoleShell({ rol }: { rol: Rol }) {
  const usuario = useSession((s) => s.usuario);
  const { salir } = useSalir();
  // HU-74 · El tema oscuro rige solo dentro de la app
  useTemaDeLaApp();

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
      // HU-70 · Campana de avisos (cliente y admin); el mecánico no recibe avisos
      acciones={rol !== 'mecanico' && <CampanaAvisos to={`/${rol}/avisos`} />}
    />
  );
}
