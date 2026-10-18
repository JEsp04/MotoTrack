import { Link, useNavigate } from 'react-router';
import { Icon } from '@/components/ui';
import { HOME_POR_ROL, RegistroClienteForm } from '@/features/auth';
import { toast } from '@/lib/toast';

/** HU-20 · Registro de cliente. Al terminar queda con sesión. */
export default function RegistroClientePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/registro"
          className="-ml-1 inline-flex min-h-10 items-center gap-1 rounded-full pr-3 pl-1 text-sm font-semibold text-ink hover:bg-surface-sunken"
        >
          <Icon name="back" size={20} />
          Tipo de cuenta
        </Link>
        <h1 className="mt-3 text-[2rem] leading-tight tracking-[-0.035em]">
          Crea tu cuenta de cliente
        </h1>
      </div>
      <RegistroClienteForm
        onRegistro={(usuario) => {
          toast('¡Bienvenido a MotoTrack!', 'success');
          navigate(HOME_POR_ROL[usuario.rol], { replace: true });
        }}
      />
      <p className="text-center text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink"
        >
          Ingresa
        </Link>
      </p>
    </div>
  );
}
