import { AppBar } from '@/components/ui';
import { OrdenesLista } from '@/features/ordenes';

/** HU-30 · Órdenes de las motos del cliente */
export default function OrdenesClientePage() {
  return (
    <>
      <AppBar title="Mis órdenes" subtitle="En qué va cada reparación" />
      <div className="p-4 lg:px-0">
        <OrdenesLista rol="cliente" />
      </div>
    </>
  );
}
