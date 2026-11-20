import { useParams } from 'react-router';
import { MotoFichaVista } from '@/features/motos';

/** HU-61 · /admin/motos/:id */
export default function MotoPage() {
  const { id = '' } = useParams();
  return <MotoFichaVista key={id} publicId={id} rol="admin" />;
}
