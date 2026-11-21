import { useLocation, useNavigate } from 'react-router';
import { useSession } from '@/features/auth';
import { SuscripcionVista } from '@/features/suscripcion';

/** HU-80 · /admin/suscripcion. Se llega desde «Más» o el menú del avatar. */
export default function SuscripcionPage() {
  const navigate = useNavigate();
  const { key } = useLocation();
  const taller = useSession((s) => s.usuario?.taller.nombre ?? '');
  return (
    <SuscripcionVista
      taller={taller}
      onBack={() => void (key === 'default' ? navigate('/admin/mas') : navigate(-1))}
      onPagar={(pago) =>
        void navigate(
          pago.tipo === 'plan'
            ? `/admin/suscripcion/pago?tipo=plan&plan=${pago.plan}`
            : '/admin/suscripcion/pago?tipo=metodo',
        )
      }
    />
  );
}
