import { Link } from 'react-router';
import { Icon, type IconName } from '@/components/ui';

const OPCIONES: Array<{ to: string; icon: IconName; title: string; text: string }> = [
  {
    to: '/registro/taller',
    icon: 'wrench',
    title: 'Tengo un taller',
    text: 'Crea la cuenta de tu taller y administra órdenes, clientes y mecánicos.',
  },
  {
    to: '/registro/cliente',
    icon: 'moto',
    title: 'Soy cliente',
    text: 'Sigue la reparación de tu moto y aprueba los diagnósticos desde el celular.',
  },
];

/** HU-20 · Elegir el tipo de cuenta. Los mecánicos no se registran solos: los crea el admin. */
export default function RegistroPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[2rem] leading-tight tracking-[-0.035em]">Crea tu cuenta</h1>
        <p className="mt-2 text-ink-muted">¿Cómo vas a usar MotoTrack?</p>
      </div>
      <ul className="flex flex-col overflow-hidden rounded-md bg-surface-sunken">
        {OPCIONES.map((o) => (
          <li key={o.to} className="border-b border-border last:border-0">
            <Link
              to={o.to}
              className="flex items-center gap-4 p-5 transition-colors duration-150 hover:bg-surface-2"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-surface text-ink">
                <Icon name={o.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.title}</span>
                <span className="block text-sm text-ink-muted">{o.text}</span>
              </span>
              <Icon name="chevronRight" size={20} className="shrink-0 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-muted">
        ¿Eres mecánico? Pídele al administrador de tu taller que te cree la cuenta.
      </p>
      <p className="text-center text-ink-muted">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink"
        >
          Ingresa
        </Link>
      </p>
    </div>
  );
}
