import type { EstadoOrden } from '@/types';

export type Tono = 'neutral' | 'primary' | 'accent' | 'success' | 'danger';

/** Texto en español y color de cada estado. Las transiciones viven en features/ordenes. */
export const ESTADOS_ORDEN: Record<EstadoOrden, { label: string; tono: Tono }> = {
  registrada: { label: 'Registrada', tono: 'neutral' },
  diagnosticada: { label: 'Diagnosticada', tono: 'primary' },
  esperando_aprobacion: { label: 'Esperando aprobación', tono: 'accent' },
  aprobada: { label: 'Aprobada', tono: 'primary' },
  en_reparacion: { label: 'En reparación', tono: 'primary' },
  pendiente_repuesto: { label: 'Falta repuesto', tono: 'accent' },
  lista_entrega: { label: 'Lista para entregar', tono: 'success' },
  entregada: { label: 'Entregada', tono: 'success' },
  cerrada: { label: 'Cerrada', tono: 'neutral' },
  cancelada: { label: 'Cancelada', tono: 'danger' },
};

export const LISTA_ESTADOS = Object.keys(ESTADOS_ORDEN) as EstadoOrden[];
