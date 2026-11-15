const ZONA = 'America/Bogota';

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** 85000 → "$ 85.000" */
export function formatPesos(valor: number): string {
  return moneda.format(valor).replace(/\u00a0/g, ' ');
}

/** Fecha ISO (UTC) → "10 oct 2026, 9:45 a. m." en hora de Colombia */
export function formatFechaHora(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(/\u00a0/g, ' ');
}

/** Fecha ISO (UTC) → "10 oct 2026" en hora de Colombia */
export function formatFecha(iso: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Día «AAAA-MM-DD» (sin hora) → "5 nov", como en el prototipo. No se mueve de zona horaria. */
export function formatDia(dia: string): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', day: 'numeric', month: 'short' })
    .format(new Date(`${dia}T00:00:00Z`))
    .replace('.', '')
    .replace(' de ', ' ');
}

/** Hoy en Colombia como «AAAA-MM-DD» (para el mínimo de un campo de fecha) */
export function hoyColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
}

/** Formatea la placa como se ve en la moto: ABC12D → "ABC 12D" */
export function formatPlaca(placa: string) {
  const limpia = placa.replace(/\s+/g, '').toUpperCase();
  return limpia.length > 3 ? `${limpia.slice(0, 3)} ${limpia.slice(3)}` : limpia;
}
