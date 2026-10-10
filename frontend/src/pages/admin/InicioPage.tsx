import { Link } from 'react-router';
import { AppBar, Card, Icon, type IconName } from '@/components/ui';
import { useSession } from '@/features/auth';

const ACCESOS: Array<{ to: string; icon: IconName; title: string; text: string }> = [
  {
    to: '/admin/ordenes',
    icon: 'clipboard',
    title: 'Órdenes',
    text: 'Crea órdenes y sigue cada reparación',
  },
  {
    to: '/admin/clientes',
    icon: 'users',
    title: 'Clientes',
    text: 'Registra clientes y sus motos',
  },
  { to: '/admin/equipo', icon: 'team', title: 'Equipo', text: 'Crea las cuentas de tus mecánicos' },
];

export default function InicioPage() {
  const nombre = useSession((s) => s.usuario?.nombre.split(' ')[0] ?? '');

  return (
    <>
      <AppBar title={`Hola, ${nombre}`} subtitle="Esto es lo que pasa hoy en tu taller" />
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
        {ACCESOS.map((a) => (
          <Link key={a.to} to={a.to} className="group rounded-md focus-visible:outline-offset-4">
            <Card className="flex h-full items-center gap-4 transition-colors group-hover:border-primary">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                <Icon name={a.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{a.title}</span>
                <span className="block text-sm text-ink-muted">{a.text}</span>
              </span>
              <Icon name="chevronRight" className="shrink-0 text-ink-muted" size={20} />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
