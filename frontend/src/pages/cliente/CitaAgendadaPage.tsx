import { useParams, useSearchParams } from 'react-router';
import { CitaAgendada } from '@/features/citas';

/** HU-59 · /cliente/citas/:id/agendada (HU-60: ?reprogramada=1 después de reprogramar) */
export default function CitaAgendadaPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  return <CitaAgendada publicId={id} reprogramada={params.has('reprogramada')} />;
}
