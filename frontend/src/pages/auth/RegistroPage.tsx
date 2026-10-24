import { Link } from 'react-router';
import { Badge, LeadIcon, Radio, type IconName } from '@/components/ui';
import { AccesoTitulo } from './AccesoLink';

const OPCIONES: Array<{ to: string; icon: IconName; title: string; text: string; badge?: string }> =
  [
    {
      to: '/registro/taller',
      icon: 'home',
      title: 'Tengo un taller',
      text: 'Creas el taller y quedas como administrador. Planes desde $ 80.000/mes.',
    },
    {
      to: '/login',
      icon: 'wrench',
      title: 'Trabajo en un taller',
      text: 'El administrador de tu taller te crea la cuenta. Entra con el correo y la clave que te dé.',
    },
    {
      to: '/registro/cliente',
      icon: 'moto',
      title: 'Soy cliente',
      badge: 'Gratis',
      text: 'Sigue tu moto y aprueba cotizaciones desde el celular.',
    },
  ];

/** HU-20 · Elegir el tipo de cuenta (RegisterChoiceScreen del prototipo). */
export default function RegistroPage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-5 pb-7">
      <AccesoTitulo
        titulo="¿Qué cuenta necesitas?"
        texto="Cada rol ve y hace cosas distintas en MotoTrack."
      />
      <ul className="flex flex-col gap-2.5">
        {OPCIONES.map((o) => (
          <li key={o.title}>
            <Link
              to={o.to}
              className="flex items-start gap-3 rounded-[18px] border border-border bg-surface px-4 py-3 text-ink hover:border-ink"
            >
              <span className="mt-0.5">
                <Radio checked={false} />
              </span>
              <LeadIcon icon={o.icon} className="bg-surface" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {o.title}
                  {o.badge && <Badge tono="primary">{o.badge}</Badge>}
                </span>
                <span className="block text-sm leading-5 text-ink-muted">{o.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-border-strong underline-offset-4"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
