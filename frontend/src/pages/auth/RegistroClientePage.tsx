import { Link, useNavigate } from 'react-router';
import { IconButton } from '@/components/ui';
import { HOME_POR_ROL, RegistroClienteForm } from '@/features/auth';
import { toast } from '@/lib/toast';
import { AccesoTitulo } from './AccesoLink';

/** HU-20 · Registro de cliente (ClientRegisterScreen del prototipo). Al terminar queda con sesión. */
export default function RegistroClientePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
      <div className="-mt-3 -ml-3">
        <IconButton icon="back" label="Volver" onClick={() => navigate('/registro')} />
      </div>
      <AccesoTitulo
        titulo="Crea tu cuenta de cliente"
        texto="Es gratis. Con ella ves el estado de tu moto y apruebas cotizaciones."
      />
      <RegistroClienteForm
        onRegistro={(usuario) => {
          toast('¡Bienvenido a MotoTrack!', 'success');
          navigate(HOME_POR_ROL[usuario.rol], { replace: true });
        }}
      />
      <p className="text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login?tab=cliente"
          className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-border-strong underline-offset-4"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
