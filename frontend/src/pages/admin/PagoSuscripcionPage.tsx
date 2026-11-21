import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { PagoSeguro } from '@/features/suscripcion';

const VOLVER = '/admin/suscripcion';

/** HU-81 · /admin/suscripcion/pago?tipo=plan&plan=inteligente · o ?tipo=metodo */
export default function PagoSuscripcionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tipo = params.get('tipo');
  const plan = params.get('plan');
  const volver = () => void navigate(VOLVER, { replace: true });

  if (tipo === 'metodo') return <PagoSeguro tipo="metodo" onBack={volver} onTerminar={volver} />;
  if (tipo === 'plan' && (plan === 'basico' || plan === 'inteligente')) {
    return <PagoSeguro tipo="plan" plan={plan} onBack={volver} onTerminar={volver} />;
  }
  return <Navigate to={VOLVER} replace />;
}
