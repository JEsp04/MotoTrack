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
        <h1 className="text-2xl">Crea tu cuenta</h1>
        <p className="mt-1 text-ink-muted">¿Cómo vas a usar MotoTrack?</p>
      </div>
      <ul className="flex flex-col gap-3">
        {OPCIONES.map((o) => (
          <li key={o.to}>
            <Link
              to={o.to}
              className="flex items-center gap-4 rounded-md border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
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
        <Link to="/login" className="font-semibold text-primary-text hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
