import { useParams } from 'react-router';
import { ReprogramarCita } from '@/features/citas';

/** HU-60 · /cliente/citas/:id/reprogramar */
export default function ReprogramarCitaPage() {
  const { id = '' } = useParams();
  return <ReprogramarCita publicId={id} />;
}
