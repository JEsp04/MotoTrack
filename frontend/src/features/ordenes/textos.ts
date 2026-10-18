import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import type { EstadoOrden } from '@/types';

/** Texto en español de cada estado */
export const ETIQUETA_ESTADO = Object.fromEntries(
  Object.entries(ESTADOS_ORDEN).map(([estado, { label }]) => [estado, label]),
) as Record<EstadoOrden, string>;

/** Mensaje para el cliente según el estado de su orden (HU-34, HU-35), igual al prototipo */
export const MENSAJE_CLIENTE: Partial<
  Record<EstadoOrden, { texto: string; tono: 'info' | 'success' }>
> = {
  registrada: { texto: 'Recibimos tu moto.', tono: 'info' },
  diagnosticada: { texto: 'Estamos preparando tu cotización.', tono: 'info' },
  esperando_aprobacion: {
    texto: 'Revisa la cotización y apruébala para que empecemos.',
    tono: 'info',
  },
  aprobada: { texto: 'Aprobaste la cotización. El mecánico empieza pronto.', tono: 'info' },
  en_reparacion: { texto: 'Tu moto está en reparación.', tono: 'info' },
  pendiente_repuesto: { texto: 'Estamos esperando un repuesto.', tono: 'info' },
  lista_entrega: { texto: '¡Tu moto está lista! Puedes recogerla.', tono: 'success' },
  entregada: { texto: 'Entregada. Gracias por confiar en nosotros.', tono: 'success' },
  cerrada: { texto: 'Orden finalizada.', tono: 'info' },
  cancelada: { texto: 'La orden se canceló. Puedes recoger tu moto sin reparación.', tono: 'info' },
};

/**
 * Textos del botón de mantener presionado (HU-48, docs/diseno.md sección 7), según la acción.
 * `mantener`: lo que dice el botón; `soltar`: lo que dice cuando ya se llenó.
 */
export const TEXTO_HOLD: Record<string, { mantener: string; soltar: string }> = {
  'Enviar para aprobación': {
    mantener: 'Mantén para enviar a aprobación',
    soltar: 'Suelta para enviar',
  },
  Aprobar: { mantener: 'Mantén para aprobar', soltar: 'Suelta para aprobar' },
  Rechazar: { mantener: 'Mantén para rechazar', soltar: 'Suelta para rechazar' },
  'Iniciar reparación': {
    mantener: 'Mantén para iniciar la reparación',
    soltar: 'Suelta para iniciar',
  },
  'Lista para entregar': {
    mantener: 'Mantén para marcar lista',
    soltar: 'Suelta para marcar lista',
  },
  'Falta repuesto': { mantener: 'Mantén para guardar', soltar: 'Suelta para guardar' },
  Reanudar: { mantener: 'Mantén para reanudar', soltar: 'Suelta para reanudar' },
  'Entregar moto': { mantener: 'Mantén para entregar la moto', soltar: 'Suelta para entregar' },
  'Cerrar orden': { mantener: 'Mantén para cerrar la orden', soltar: 'Suelta para cerrar' },
  'Cancelar orden': { mantener: 'Mantén para cancelar la orden', soltar: 'Suelta para cancelar' },
};

export const textoHold = (label: string) =>
  TEXTO_HOLD[label] ?? {
    mantener: `Mantén para ${label.toLowerCase()}`,
    soltar: 'Suelta para confirmar',
  };

/** Motivos para rechazar la cotización, como en el prototipo (HU-49) */
export const MOTIVOS_RECHAZO = [
  'El precio es muy alto',
  'Quiero otra opinión',
  'Lo haré más adelante',
  'Otro motivo',
];
