import { useLocation, useNavigate } from 'react-router';
import { ResenasVista } from '@/features/resenas';

/** HU-89 · Reseñas de los clientes (solo el admin). Se llega desde «Más», el menú del avatar o el panel. */
export default function ResenasPage() {
  const navigate = useNavigate();
  const { key } = useLocation();
  return (
    <ResenasVista onBack={() => void (key === 'default' ? navigate('/admin/mas') : navigate(-1))} />
  );
}
