import { useNavigate, useSearchParams } from 'react-router';
import { HOME_POR_ROL, RegistroTallerForm } from '@/features/auth';
import { toast } from '@/lib/toast';

/** HU-20, HU-83 · Registro del taller en 2 pasos (conserva el plan elegido en la landing). */
export default function RegistroTallerPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planParam = params.get('plan');
  const planElegido = planParam === 'basico' || planParam === 'inteligente' ? planParam : undefined;

  return (
    <RegistroTallerForm
      planElegido={planElegido}
      onVolver={() => navigate('/registro')}
      onRegistro={(usuario) => {
        toast('¡Listo! Tu taller quedó creado.', 'success');
        navigate(HOME_POR_ROL[usuario.rol], { replace: true });
      }}
    />
  );
}
