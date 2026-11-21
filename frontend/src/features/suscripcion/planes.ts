import type { IconName } from '@/components/ui';
import type { PlanTaller } from '@/types';

/** HU-80 · Planes de MotoTrack con los textos del prototipo (precio con IVA incluido) */
export const PLANES: Record<
  PlanTaller,
  { nombre: string; precio: number; icon: IconName; gana: string; pierde: string }
> = {
  basico: {
    nombre: 'Básico',
    precio: 80_000,
    icon: 'clipboard',
    gana: 'Órdenes de servicio, clientes y motos, inventario, citas y portal del cliente.',
    pierde: 'Pierdes las alertas IA, el asistente y los recordatorios automáticos.',
  },
  inteligente: {
    nombre: 'Inteligente',
    precio: 130_000,
    icon: 'sparkle',
    gana: 'Suma predicciones de IA, asistente de diagnóstico y recordatorios automáticos.',
    pierde: '',
  },
};

export const OTRO_PLAN: Record<PlanTaller, PlanTaller> = {
  basico: 'inteligente',
  inteligente: 'basico',
};

/** Fecha «2026-12-17» (sin hora): se fija al mediodía UTC para que no cambie de día en Colombia */
export const fechaDia = (dia: string) => `${dia}T12:00:00Z`;
