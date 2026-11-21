import type { Recordatorio } from '@/types';

/** Motivos para rechazar un recordatorio (los del prototipo, iguales en el backend) */
export const MOTIVOS_RECHAZO = [
  'El servicio ya se hizo',
  'No aplica para esta moto',
  'El cliente no quiere recordatorios',
  'Otro motivo',
] as const;

/**
 * Mensaje de WhatsApp para el cliente. Es el mismo que arma el backend al aprobar; se escribe
 * aquí para mostrar la vista previa y abrir WhatsApp en el mismo toque (sin bloqueo de ventanas).
 */
export function mensajeRecordatorio(r: Recordatorio, taller: string) {
  const nombre = r.moto.cliente.nombre.split(' ')[0];
  const moto = `${r.moto.marca} ${r.moto.referencia} (${r.moto.placa})`;
  return `Hola ${nombre}, según el historial de tu ${moto}, te recomendamos: ${r.titulo.toLowerCase()}.\n\nPide tu cita en la app de ${taller} o responde este mensaje.`;
}
