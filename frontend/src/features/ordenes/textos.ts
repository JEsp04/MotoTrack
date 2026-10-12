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
