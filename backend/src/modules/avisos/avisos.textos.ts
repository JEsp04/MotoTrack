import type { EstadoOrden, TipoAviso } from '../../generated/prisma/client.js';

/** Lo que se necesita de la orden para escribir el aviso */
export interface OrdenParaAviso {
  numero: number;
  placa: string;
}

export interface TextoAviso {
  tipo: TipoAviso;
  titulo: string;
  texto: string;
}

/** «#12 · KLM45F» */
const ref = (o: OrdenParaAviso) => `Orden #${o.numero} · ${o.placa}`;

/**
 * HU-69 · Aviso para el cliente dueño cuando su orden cambia de estado.
 * Los mensajes son los del prototipo (MSG_CLIENTE). `de` permite distinguir un rechazo
 * de la cotización de una cancelación del taller.
 */
export function avisoParaCliente(
  orden: OrdenParaAviso,
  de: EstadoOrden | null,
  a: EstadoOrden,
  observacion: string | null,
): TextoAviso {
  const r = ref(orden);
  switch (a) {
    case 'registrada':
      return { tipo: 'estado', titulo: 'Recibimos tu moto', texto: `${r}. Recibimos tu moto.` };
    case 'diagnosticada':
      return {
        tipo: 'estado',
        titulo: 'Estamos revisando tu moto',
        texto: `${r}. Estamos preparando tu cotización.`,
      };
    case 'esperando_aprobacion':
      return {
        tipo: 'cotizacion',
        titulo: 'Cotización lista para aprobar',
        texto: `${r}. Revisa la cotización y apruébala para que empecemos.`,
      };
    case 'aprobada':
      return {
        tipo: 'estado',
        titulo: 'Recibimos tu aprobación',
        texto: `${r}. Aprobaste la cotización. El mecánico empieza pronto.`,
      };
    case 'en_reparacion':
      return {
        tipo: 'estado',
        titulo: 'Tu moto está en reparación',
        texto: `${r}. Tu moto está en reparación.`,
      };
    case 'pendiente_repuesto':
      return {
        tipo: 'estado',
        titulo: 'Estamos esperando un repuesto',
        texto: `${r}. Estamos esperando un repuesto.`,
      };
    case 'lista_entrega':
      return {
        tipo: 'estado',
        titulo: '¡Tu moto está lista!',
        texto: `${r}. ¡Tu moto está lista! Puedes recogerla.`,
      };
    case 'entregada':
      return {
        tipo: 'estado',
        titulo: 'Moto entregada',
        texto: `${r}. Entregada. Gracias por confiar en nosotros.`,
      };
    case 'cerrada':
      return { tipo: 'estado', titulo: 'Orden finalizada', texto: `${r}. Orden finalizada.` };
    case 'cancelada':
      return de === 'esperando_aprobacion'
        ? {
            tipo: 'estado',
            titulo: 'Recoge tu moto',
            texto: `${r}. Rechazaste la cotización. Tu moto está lista para recoger sin reparación.`,
          }
        : {
            tipo: 'estado',
            titulo: 'Orden cancelada',
            texto:
              `${r}. El taller canceló la orden${observacion ? `: ${observacion}` : '.'}`.slice(
                0,
                500,
              ),
          };
  }
}

/** HU-69 · Aviso para los admin cuando el cliente aprueba o rechaza la cotización desde la app */
export function avisoParaTaller(
  orden: OrdenParaAviso,
  cliente: string,
  aprobo: boolean,
  observacion: string | null,
): TextoAviso {
  return aprobo
    ? {
        tipo: 'cotizacion',
        titulo: 'Cotización aprobada',
        texto: `${ref(orden)}. ${cliente} aprobó la cotización.`,
      }
    : {
        tipo: 'cotizacion',
        titulo: 'Cotización rechazada',
        texto:
          `${ref(orden)}. ${cliente} rechazó la cotización${observacion ? `: ${observacion}` : '.'}`.slice(
            0,
            500,
          ),
      };
}
