import { AgendaTaller } from '@/features/citas';

/** HU-58 · /mecanico/citas: la agenda en solo lectura */
export default function CitasPage() {
  return <AgendaTaller rol="mecanico" />;
}
