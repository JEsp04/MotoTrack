/**
 * Días y horas de las citas en hora de Colombia (HU-59).
 * Los días se manejan como texto «AAAA-MM-DD» para no moverse de zona horaria.
 */

const ZONA = 'America/Bogota';
const DIA_SEMANA = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'short' });
const MES = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'short' });

const fechaUtc = (dia: string) => new Date(`${dia}T00:00:00Z`);

/** «2026-11-20» + 1 → «2026-11-21» */
export function sumarDias(dia: string, n: number) {
  const d = fechaUtc(dia);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** «vie.» → «Vie» */
export function nombreDia(dia: string) {
  const t = DIA_SEMANA.format(fechaUtc(dia)).replace('.', '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const numeroDia = (dia: string) => fechaUtc(dia).getUTCDate();
export const esDomingo = (dia: string) => fechaUtc(dia).getUTCDay() === 0;
export const esSabado = (dia: string) => fechaUtc(dia).getUTCDay() === 6;

/**
 * Los próximos días en que se puede pedir cita, desde hoy y sin los domingos (cerrado),
 * como en el prototipo: 7 días.
 */
export function diasParaCita(hoy: string, cuantos = 7) {
  const dias: string[] = [];
  for (let i = 0; dias.length < cuantos; i++) {
    const dia = sumarDias(hoy, i);
    if (!esDomingo(dia)) dias.push(dia);
  }
  return dias;
}

/** «09:00» → «9:00» */
export const formatHora = (hora: string) => hora.replace(/^0/, '');

/** «Hoy» o «Vie 20 nov» */
export function formatDiaCita(dia: string, hoy: string) {
  if (dia === hoy) return 'Hoy';
  return `${nombreDia(dia)} ${numeroDia(dia)} ${MES.format(fechaUtc(dia)).replace('.', '')}`;
}

/** Fecha y hora UTC de una cita → día «AAAA-MM-DD» y hora «9:00» en Colombia */
export function partesCita(fechaHora: string) {
  const d = new Date(fechaHora);
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(d);
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return { dia, hora: formatHora(hora) };
}
