import { Link, useNavigate } from 'react-router';
import { HOME_POR_ROL, RegistroTallerForm } from '@/features/auth';
import { toast } from '@/lib/toast';

/** HU-20 · Registro del taller (2 pasos). Al terminar queda con sesión. */
export default function RegistroTallerPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/registro" className="text-sm font-semibold text-primary-text hover:underline">
          ← Tipo de cuenta
        </Link>
        <h1 className="mt-2 text-2xl">Registra tu taller</h1>
      </div>
      <RegistroTallerForm
        onRegistro={(usuario) => {
          toast('¡Listo! Tu taller quedó creado.', 'success');
          navigate(HOME_POR_ROL[usuario.rol], { replace: true });
        }}
      />
      <p className="text-center text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-primary-text hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
