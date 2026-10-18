import { AppBar } from '@/components/ui';
import { useSession } from '@/features/auth';
import { PanelTaller } from '@/features/ordenes';

const hoy = () =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  }).format(new Date());

/** HU-46 · Panel del taller: las motos que están adentro y cómo va cada una. */
export default function InicioPage() {
  const nombre = useSession((s) => s.usuario?.nombre.split(' ')[0] ?? '');
  const fecha = hoy();

  return (
    <>
      <AppBar
        title="Motos en el taller"
        subtitle={`Hola, ${nombre} · ${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}`}
      />
      <div className="p-4 lg:px-0 lg:pt-4">
        <PanelTaller />
      </div>
    </>
  );
}
