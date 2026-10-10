import { useNavigate } from 'react-router';
import { AppLayout } from '@/components/layout';
import { ROL_LABEL, useSession } from '@/features/auth';
import { toast } from '@/lib/toast';
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
  const clearSession = useSession((s) => s.clearSession);
  const navigate = useNavigate();

  function onLogout() {
    // HU-17/HU-22: aquí se llamará a POST /auth/logout antes de limpiar
    clearSession();
    navigate('/login', { replace: true });
    toast('Cerraste sesión');
  }

  return (
    <AppLayout
      items={NAV_POR_ROL[rol]}
      user={{ nombre: usuario?.nombre ?? '', rolLabel: ROL_LABEL[rol] }}
      onLogout={onLogout}
    />
  );
}
