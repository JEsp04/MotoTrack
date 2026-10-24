import { useNavigate } from 'react-router';
import { HOME_POR_ROL, RegistroTallerForm } from '@/features/auth';
import { toast } from '@/lib/toast';

/** HU-20 · Registro del taller en 2 pasos (RegisterWorkshopScreen del prototipo). Al terminar queda con sesión. */
export default function RegistroTallerPage() {
  const navigate = useNavigate();
  return (
    <RegistroTallerForm
      onVolver={() => navigate('/registro')}
      onRegistro={(usuario) => {
        toast('¡Listo! Tu taller quedó creado.', 'success');
        navigate(HOME_POR_ROL[usuario.rol], { replace: true });
      }}
    />
  );
}
