/**
 * HU-71 · Cuentas de fechas de los reportes, siempre en hora de Colombia (UTC-5, sin horario
 * de verano). Las fechas se guardan en UTC; aquí se pasa a la hora local para saber a qué
 * día, semana o mes pertenece cada orden.
 */

export type Periodo = 'semana' | 'mes';

/** Colombia está 5 horas detrás de UTC todo el año */
const DESFASE_MS = 5 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** La fecha en Colombia, con sus campos leídos como UTC (getUTCDate, getUTCDay…) */
function local(fecha: Date) {
  return new Date(fecha.getTime() - DESFASE_MS);
}

/** Medianoche de Colombia de ese día (año, mes, día locales) como instante UTC */
function medianoche(anio: number, mes: number, dia: number) {
  return new Date(Date.UTC(anio, mes, dia) + DESFASE_MS);
}

/** Día de la semana en Colombia: 0 = lunes … 6 = domingo */
export function diaSemana(fecha: Date) {
  return (local(fecha).getUTCDay() + 6) % 7;
}

/** «AAAA-MM-DD» del día en Colombia */
export function diaLocal(fecha: Date) {
  return local(fecha).toISOString().slice(0, 10);
}

/** «AAAA-MM-DD» → mediodía de ese día en Colombia (para no caer en el día anterior) */
export function desdeDia(dia: string) {
  const [a, m, d] = dia.split('-').map(Number) as [number, number, number];
  return new Date(medianoche(a, m - 1, d).getTime() + DIA_MS / 2);
}

export interface Rango {
  desde: Date;
  /** Exclusivo */
  hasta: Date;
}

/**
 * La semana (lunes a domingo) o el mes calendario que contiene `referencia`, y el periodo
 * anterior completo para comparar.
 */
export function rangos(periodo: Periodo, referencia: Date) {
  const l = local(referencia);
  const anio = l.getUTCFullYear();
  const mes = l.getUTCMonth();
  if (periodo === 'semana') {
    const desde = medianoche(anio, mes, l.getUTCDate() - diaSemana(referencia));
    const hasta = new Date(desde.getTime() + 7 * DIA_MS);
    const anterior = { desde: new Date(desde.getTime() - 7 * DIA_MS), hasta: desde };
    return { actual: { desde, hasta }, anterior, nombreAnterior: 'semana ant.' };
  }
  const desde = medianoche(anio, mes, 1);
  const hasta = medianoche(anio, mes + 1, 1);
  const anterior = { desde: medianoche(anio, mes - 1, 1), hasta: desde };
  return { actual: { desde, hasta }, anterior, nombreAnterior: MESES[(mes + 11) % 12]! };
}
