import { useNavigate, useSearchParams } from 'react-router';
import { AppBar } from '@/components/ui';
import { NuevaOrdenForm } from '@/features/ordenes';

/** HU-29 · Crear una orden de servicio */
export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <div className="mx-auto w-full max-w-form">
      <AppBar
        title="Recibir moto"
        subtitle="Cliente, moto y mecánico"
        onBack={() => navigate(-1)}
      />
      <div className="p-4 lg:px-0">
        <NuevaOrdenForm clienteInicial={params.get('cliente') ?? undefined} />
      </div>
    </div>
  );
}
