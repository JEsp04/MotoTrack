import { useNavigate, useParams, useSearchParams } from 'react-router';
import { HOME_POR_ROL, UnirseTaller } from '@/features/auth';
import { toast } from '@/lib/toast';

/**
 * HU-67 · «Únete a tu taller», en el panel sobre la landing. `/i/:codigo` es el enlace del
 * mensaje de invitación y trae el código ya escrito; `/unirse` lo pide.
 */
export default function UnirsePage() {
  const navigate = useNavigate();
  const { codigo } = useParams();
  const [params] = useSearchParams();
  return (
    <UnirseTaller
      codigoInicial={codigo ?? params.get('codigo') ?? ''}
      onRegistro={(usuario, taller) => {
        toast(`¡Listo! Ya eres parte de ${taller}.`, 'success');
        navigate(HOME_POR_ROL[usuario.rol], { replace: true });
      }}
    />
  );
}
