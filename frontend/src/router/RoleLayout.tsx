import { AppLayout } from '@/components/layout';
import { ROL_LABEL, useSalir, useSession } from '@/features/auth';
import type { Rol } from '@/types';
import { RequireRole } from './guards';
import { NAV_POR_ROL } from './nav';

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

  return (
    <AppLayout
      items={NAV_POR_ROL[rol]}
      user={{ nombre: usuario?.nombre ?? '', rolLabel: ROL_LABEL[rol] }}
      onLogout={salir}
    />
  );
}
