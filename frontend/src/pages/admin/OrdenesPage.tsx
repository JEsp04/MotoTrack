import { useNavigate } from 'react-router';
import { AppBar, Button } from '@/components/ui';
import { OrdenesLista } from '@/features/ordenes';

/** HU-30 · Todas las órdenes del taller */
export default function OrdenesPage() {
  const navigate = useNavigate();
  const nueva = (
    <Button icon="plus" size="sm" onClick={() => navigate('/admin/ordenes/nueva')}>
      Nueva orden
    </Button>
  );
  return (
    <>
      <AppBar title="Órdenes" subtitle="Todas las órdenes del taller" actions={nueva} />
      <div className="p-4 lg:px-0">
        <OrdenesLista rol="admin" accionVacia={nueva} />
      </div>
    </>
  );
}
