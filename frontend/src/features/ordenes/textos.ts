import { ESTADOS_ORDEN } from '@/lib/estados-orden';
import type { EstadoOrden } from '@/types';

/** Texto en español de cada estado */
export const ETIQUETA_ESTADO = Object.fromEntries(
  Object.entries(ESTADOS_ORDEN).map(([estado, { label }]) => [estado, label]),
) as Record<EstadoOrden, string>;

/** Mensaje para el cliente según el estado de su orden (HU-34, HU-35) */
export const MENSAJE_CLIENTE: Partial<
  Record<EstadoOrden, { texto: string; tono: 'info' | 'success' }>
> = {
  registrada: { texto: 'Recibimos tu moto. El mecánico la va a revisar.', tono: 'info' },
  diagnosticada: {
    texto: 'El mecánico ya revisó tu moto. Pronto te enviamos el costo.',
    tono: 'info',
  },
  esperando_aprobacion: {
    texto: 'Revisa el diagnóstico y el costo, y dinos si apruebas la reparación.',
    tono: 'info',
  },
  aprobada: { texto: 'Aprobaste la reparación. Pronto empezamos.', tono: 'info' },
  en_reparacion: { texto: 'Estamos reparando tu moto.', tono: 'info' },
  pendiente_repuesto: {
    texto: 'Estamos esperando un repuesto para seguir con la reparación.',
    tono: 'info',
  },
  lista_entrega: { texto: 'Tu moto está lista. Puedes recogerla.', tono: 'success' },
  entregada: { texto: 'Ya recogiste tu moto. ¡Gracias por confiar en el taller!', tono: 'success' },
  cancelada: { texto: 'Esta orden se canceló. Puedes recoger tu moto en el taller.', tono: 'info' },
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
