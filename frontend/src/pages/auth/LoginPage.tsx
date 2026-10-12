import { Link, useLocation, useNavigate } from 'react-router';
import { destinoTrasIngreso, LoginForm } from '@/features/auth';

/** HU-19 · Ingreso. Si venía de una ruta privada, vuelve a ella al entrar. */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { from?: string } | null)?.from;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Ingresa a tu cuenta</h1>
        <p className="mt-1 text-ink-muted">Sigue tus órdenes y el estado de cada moto.</p>
      </div>
      <LoginForm
        onIngreso={(usuario) => navigate(destinoTrasIngreso(usuario.rol, desde), { replace: true })}
      />
      <p className="text-center text-ink-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-primary-text hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
