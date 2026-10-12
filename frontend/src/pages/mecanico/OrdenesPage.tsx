import { AppBar } from '@/components/ui';
import { OrdenesLista } from '@/features/ordenes';

/** HU-30 · Órdenes asignadas al mecánico */
export default function OrdenesMecanicoPage() {
  return (
    <>
      <AppBar title="Mis órdenes" subtitle="Motos asignadas a ti" />
      <div className="p-4 lg:px-0">
        <OrdenesLista rol="mecanico" />
      </div>
    </>
  );
}
