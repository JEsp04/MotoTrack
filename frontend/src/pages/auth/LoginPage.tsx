import { useLocation, useNavigate } from 'react-router';
import { Button, Card } from '@/components/ui';
import { entrarComoDemo, HOME_POR_ROL } from '@/features/auth';
import type { Rol } from '@/types';

/**
 * PROVISIONAL. El formulario real de ingreso llega con HU-19.
 * Por ahora, en desarrollo, permite entrar con un rol de prueba para revisar
 * la navegación de cada uno.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { from?: string } | null)?.from;

  function entrar(rol: Rol) {
    entrarComoDemo(rol);
    const destino = desde?.startsWith(HOME_POR_ROL[rol]) ? desde : HOME_POR_ROL[rol];
    navigate(destino, { replace: true });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Ingresa a tu cuenta</h1>
        <p className="mt-1 text-ink-muted">El formulario con correo y contraseña llega en HU-19.</p>
      </div>
      {import.meta.env.DEV ? (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink-muted">Modo desarrollo: entrar como…</p>
          <Button fullWidth onClick={() => entrar('admin')}>
            Administrador
          </Button>
          <Button variant="secondary" fullWidth onClick={() => entrar('mecanico')}>
            Mecánico
          </Button>
          <Button variant="secondary" fullWidth onClick={() => entrar('cliente')}>
            Cliente
          </Button>
        </Card>
      ) : (
        <Card>
          <p className="text-ink-muted">El ingreso estará disponible muy pronto.</p>
        </Card>
      )}
    </div>
  );
}
