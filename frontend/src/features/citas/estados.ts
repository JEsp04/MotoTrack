import type { EstadoCita } from '@/types';

/** Nombre y tono del chip de cada estado (citaTone del prototipo) */
export const ESTADO_CITA: Record<
  EstadoCita,
  { label: string; tono: 'neutral' | 'primary' | 'success' | 'danger' }
> = {
  programada: { label: 'Programada', tono: 'neutral' },
  confirmada: { label: 'Confirmada', tono: 'primary' },
  atendida: { label: 'Atendida', tono: 'success' },
  cancelada: { label: 'Cancelada', tono: 'danger' },
};

/** Una cita programada o confirmada todavía se puede reprogramar o cancelar */
export const citaActiva = (estado: EstadoCita) =>
  estado === 'programada' || estado === 'confirmada';
