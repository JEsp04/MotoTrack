import { useLocation, useNavigate } from 'react-router';
import { useSession } from '@/features/auth';
import { AvisosVista } from '@/features/avisos';

/** HU-70 · «Avisos» del cliente y del admin. Se llega desde la campana. */
export default function AvisosPage() {
  const rol = useSession((s) => s.usuario?.rol);
  const navigate = useNavigate();
  const { key } = useLocation();
  const base = rol === 'admin' ? '/admin' : '/cliente';
  return (
    <AvisosVista
      base={base}
      onBack={() => void (key === 'default' ? navigate(base) : navigate(-1))}
    />
  );
}
