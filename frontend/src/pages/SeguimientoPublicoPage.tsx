import { useParams } from 'react-router';
import { SeguimientoPublico } from '@/features/ordenes';

/** HU-90 · Enlace público de seguimiento `/s/:id` (se comparte por WhatsApp, sin cuenta) */
export default function SeguimientoPublicoPage() {
  const { id = '' } = useParams();
  return <SeguimientoPublico publicId={id} />;
}
