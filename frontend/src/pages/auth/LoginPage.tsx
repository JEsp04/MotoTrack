import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Segmented } from '@/components/ui';
import { destinoTrasIngreso, LoginForm } from '@/features/auth';
import { AccesoLink, AccesoLinks, AccesoTitulo } from './AccesoLink';

type Pestana = 'taller' | 'cliente';

/**
 * HU-19 · Ingreso, en el panel sobre la landing (LoginScreen del prototipo).
 * «Soy del taller» y «Soy cliente» entran igual, con correo y contraseña.
 * Si venía de una ruta privada, vuelve a ella al entrar.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const desde = (location.state as { from?: string } | null)?.from;
  const tab: Pestana = params.get('tab') === 'cliente' ? 'cliente' : 'taller';

  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
      <Segmented
        label="Tipo de cuenta"
        value={tab}
        onChange={(t) =>
          setParams(t === 'cliente' ? { tab: 'cliente' } : {}, {
            replace: true,
            state: location.state,
          })
        }
        options={[
          { id: 'taller', label: 'Soy del taller' },
          { id: 'cliente', label: 'Soy cliente' },
        ]}
      />
      {tab === 'taller' ? (
        <AccesoTitulo titulo="Ingresa a tu taller" texto="Para administradores y mecánicos." />
      ) : (
        <AccesoTitulo
          titulo="Sigue tu moto"
          texto="Ingresa con tu correo para ver el estado de tu moto y aprobar cotizaciones."
        />
      )}
      <LoginForm
        onIngreso={(usuario) => navigate(destinoTrasIngreso(usuario.rol, desde), { replace: true })}
      />
      <AccesoLinks>
        {tab === 'taller' ? (
          <AccesoLink
            to="/registro/taller"
            icon="home"
            titulo="Registrar mi taller"
            texto="Crea la cuenta como administrador"
          />
        ) : (
          <AccesoLink
            to="/registro/cliente"
            icon="user"
            titulo="¿Primera vez? Crea tu cuenta"
            texto="Toma menos de un minuto"
          />
        )}
      </AccesoLinks>
    </div>
  );
}
