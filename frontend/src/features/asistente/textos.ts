import type { IconName } from '@/components/ui';
import type { Tono } from '@/lib/estados-orden';
import type { UrgenciaIA } from '@/types';

/** HU-79 · Síntomas rápidos del prototipo (iguales a SINTOMAS del backend) */
export const SINTOMAS = ['Ruido al frenar', 'No enciende', 'Ruido en la cadena', 'Sale humo'];
export const OTRA_CONSULTA = 'Hacer otra consulta';
export const NO_DISPONIBLE = 'El asistente no está disponible en este momento. Intenta más tarde.';

/** Urgencia con los textos y colores del prototipo (DiagnosisCard) */
export const URGENCIA: Record<UrgenciaIA, { label: string; tono: Tono; icon: IconName }> = {
  alta: { label: 'Urgente', tono: 'danger', icon: 'alert' },
  media: { label: 'Revisar pronto', tono: 'accent', icon: 'clock' },
  baja: { label: 'Puede esperar', tono: 'success', icon: 'check' },
};
