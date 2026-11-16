import { useParams } from 'react-router';
import { OrdenDetalleVista } from '@/features/ordenes';

/** HU-31 · Detalle de una orden (los 3 roles usan la misma pantalla) */
export default function OrdenDetallePage() {
  const { id = '' } = useParams();
  return <OrdenDetalleVista key={id} publicId={id} />;
}
