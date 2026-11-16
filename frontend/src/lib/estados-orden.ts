import type { EstadoOrden } from '@/types';

export type Tono = 'neutral' | 'primary' | 'accent' | 'success' | 'danger' | 'ink';

/** Ícono de cada estado (los nombres son los de components/ui/Icon) */
export type IconoEstado =
  'clipboard' | 'search' | 'clock' | 'check' | 'wrench' | 'box' | 'moto' | 'lock' | 'close';

/**
 * Texto, color, ícono y avance de cada estado, igual que en el prototipo.
 * - `paso`: de 1 a 6 en el arco de progreso; 0 si la orden se canceló.
 * - `etapa`: posición en el recorrido de 6 pasos (0 = Registro … 5 = Entregada, 6 = cerrada).
 * Las transiciones viven en features/ordenes.
 */
export const ESTADOS_ORDEN: Record<
  EstadoOrden,
  { label: string; tono: Tono; icono: IconoEstado; paso: number; etapa: number }
> = {
  registrada: { label: 'Registrada', tono: 'neutral', icono: 'clipboard', paso: 1, etapa: 0 },
  diagnosticada: { label: 'Diagnosticada', tono: 'neutral', icono: 'search', paso: 2, etapa: 1 },
  esperando_aprobacion: {
    label: 'Esperando aprobación',
    tono: 'accent',
    icono: 'clock',
    paso: 3,
    etapa: 2,
  },
  aprobada: { label: 'Aprobada', tono: 'primary', icono: 'check', paso: 4, etapa: 3 },
  en_reparacion: { label: 'En reparación', tono: 'primary', icono: 'wrench', paso: 4, etapa: 3 },
  pendiente_repuesto: {
    label: 'Falta repuesto',
    tono: 'accent',
    icono: 'box',
    paso: 4,
    etapa: 3,
  },
  lista_entrega: {
    label: 'Lista para entregar',
    tono: 'success',
    icono: 'check',
    paso: 5,
    etapa: 4,
  },
  entregada: { label: 'Entregada', tono: 'success', icono: 'moto', paso: 6, etapa: 5 },
  cerrada: { label: 'Cerrada', tono: 'ink', icono: 'lock', paso: 6, etapa: 6 },
  cancelada: { label: 'Cancelada', tono: 'danger', icono: 'close', paso: 0, etapa: -1 },
};

/** Nombres de los 6 pasos del recorrido de la orden */
export const PASOS = ['Registro', 'Diagnóstico', 'Aprobación', 'Reparación', 'Lista', 'Entregada'];

export const LISTA_ESTADOS = Object.keys(ESTADOS_ORDEN) as EstadoOrden[];
