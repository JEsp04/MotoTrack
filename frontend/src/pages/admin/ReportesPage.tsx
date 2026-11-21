import { useLocation, useNavigate } from 'react-router';
import { ReportesVista } from '@/features/reportes';

/** HU-71 · Reportes del taller (solo el admin). Se llega desde «Más» o la barra superior. */
export default function ReportesPage() {
  const navigate = useNavigate();
  const { key } = useLocation();
  return (
    <ReportesVista
      onBack={() => void (key === 'default' ? navigate('/admin/mas') : navigate(-1))}
    />
  );
}
