import { useLocation } from 'react-router';
import { PedirCita, type SugerenciaCita } from '@/features/citas';

/** HU-59 · /cliente/citas/nueva. HU-79 · Desde el asistente IA llega con el motivo sugerido. */
export default function PedirCitaPage() {
  const state = useLocation().state as { sugerencia?: SugerenciaCita } | null;
  return <PedirCita volverA="/cliente" sugerencia={state?.sugerencia} />;
}
