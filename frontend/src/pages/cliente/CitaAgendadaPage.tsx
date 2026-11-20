import { useParams } from 'react-router';
import { CitaAgendada } from '@/features/citas';

/** HU-59 · /cliente/citas/:id/agendada */
export default function CitaAgendadaPage() {
  const { id = '' } = useParams();
  return <CitaAgendada publicId={id} />;
}
