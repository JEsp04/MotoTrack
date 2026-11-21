import { useLocation, useNavigate } from 'react-router';
import { RecordatoriosVista } from '@/features/recordatorios';

/** HU-75 · Recordatorios de mantenimiento (solo el admin). */
export default function RecordatoriosPage() {
  const navigate = useNavigate();
  const { key } = useLocation();
  return <RecordatoriosVista onBack={key === 'default' ? undefined : () => void navigate(-1)} />;
}
