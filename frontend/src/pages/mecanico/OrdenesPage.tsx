import { OrdenesLista } from '@/features/ordenes';

/** HU-30 · Órdenes asignadas al mecánico */
export default function OrdenesMecanicoPage() {
  return <OrdenesLista rol="mecanico" titulo="Mis órdenes" />;
}
