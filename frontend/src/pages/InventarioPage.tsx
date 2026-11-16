import { useSession } from '@/features/auth';
import { InventarioVista } from '@/features/repuestos';

export default function InventarioPage() {
  const rol = useSession((s) => s.usuario?.rol);
  return <InventarioVista soloLectura={rol !== 'admin'} />;
}
