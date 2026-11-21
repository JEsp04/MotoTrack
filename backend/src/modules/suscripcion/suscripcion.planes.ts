import type { PlanTaller } from '../../generated/prisma/client.js';

/** HU-80 · Planes de MotoTrack. Precio mensual en pesos, con IVA incluido (como en el prototipo). */
export const PLANES: Record<PlanTaller, { nombre: string; precio: number }> = {
  basico: { nombre: 'Básico', precio: 80_000 },
  inteligente: { nombre: 'Inteligente', precio: 130_000 },
};

export const IVA = 0.19;

/** Separa un total con IVA incluido en subtotal + IVA (19 %). Siempre suma exacto. */
export function desglose(total: number) {
  const subtotal = Math.round(total / (1 + IVA));
  return { subtotal, iva: total - subtotal, total };
}

/** «FV-0007» */
export const numeroFactura = (numero: number) => `FV-${String(numero).padStart(4, '0')}`;

/** Fecha de hoy en Colombia (UTC-5), como Date a medianoche UTC para columnas @db.Date */
export function hoyColombia(ahora = new Date()) {
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** El mismo día del mes siguiente (si no existe, el último día de ese mes) */
export function mesSiguiente(fecha: Date) {
  const dia = fecha.getUTCDate();
  const destino = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 1));
  const ultimo = new Date(
    Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0),
  ).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimo));
  return destino;
}
