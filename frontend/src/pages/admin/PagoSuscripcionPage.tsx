import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { PagoSeguro } from '@/features/suscripcion';

const VOLVER = '/admin/suscripcion';

/**
 * HU-81 · /admin/suscripcion/pago?tipo=plan&plan=inteligente · o ?tipo=metodo.
 * Con &origen=registro (recién creado el taller desde la landing), al pagar se va al panel.
 * No hay «Pagar después»: sin plan pagado el panel queda bloqueado (RoleLayout).
 */
export default function PagoSuscripcionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tipo = params.get('tipo');
  const plan = params.get('plan');
  const registro = params.get('origen') === 'registro';
  const volver = () => void navigate(VOLVER, { replace: true });
  const terminar = () => void navigate(registro ? '/admin' : VOLVER, { replace: true });

  if (tipo === 'metodo') return <PagoSeguro tipo="metodo" onBack={volver} onTerminar={terminar} />;
  if (tipo === 'plan' && (plan === 'basico' || plan === 'inteligente')) {
    return <PagoSeguro tipo="plan" plan={plan} onBack={volver} onTerminar={terminar} />;
  }
  return <Navigate to={VOLVER} replace />;
}
