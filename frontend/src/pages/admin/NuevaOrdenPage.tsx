import { useSearchParams } from 'react-router';
import { NuevaOrdenForm } from '@/features/ordenes';

/** HU-29 · Recibir una moto: crear una orden de servicio */
export default function NuevaOrdenPage() {
  const [params] = useSearchParams();
  return <NuevaOrdenForm clienteInicial={params.get('cliente') ?? undefined} />;
}
