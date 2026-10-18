import type { EstadoOrden } from '@/types';

export type Tono = 'neutral' | 'primary' | 'accent' | 'success' | 'danger' | 'ink';

/**
 * Texto en español, color y paso de cada estado. Las transiciones viven en features/ordenes.
 * Colores como en el prototipo: amarillo si espera algo, verde si está lista o entregada,
 * tinta si está cerrada y rojo si está cancelada (docs/diseno.md).
 * `paso` va de 1 a 6 en el arco de progreso; 0 si la orden se canceló.
 */
export const ESTADOS_ORDEN: Record<EstadoOrden, { label: string; tono: Tono; paso: number }> = {
  registrada: { label: 'Registrada', tono: 'neutral', paso: 1 },
  diagnosticada: { label: 'Diagnosticada', tono: 'neutral', paso: 2 },
  esperando_aprobacion: { label: 'Esperando aprobación', tono: 'accent', paso: 3 },
  aprobada: { label: 'Aprobada', tono: 'primary', paso: 4 },
  en_reparacion: { label: 'En reparación', tono: 'primary', paso: 4 },
  pendiente_repuesto: { label: 'Falta repuesto', tono: 'accent', paso: 4 },
  lista_entrega: { label: 'Lista para entregar', tono: 'success', paso: 5 },
  entregada: { label: 'Entregada', tono: 'success', paso: 6 },
  cerrada: { label: 'Cerrada', tono: 'ink', paso: 6 },
  cancelada: { label: 'Cancelada', tono: 'danger', paso: 0 },
};

/** Nombres de los 6 pasos del arco (Recibida → Entregada) */
export const PASOS = ['Recibida', 'Diagnóstico', 'Cotización', 'Reparación', 'Lista', 'Entregada'];

export const LISTA_ESTADOS = Object.keys(ESTADOS_ORDEN) as EstadoOrden[];
