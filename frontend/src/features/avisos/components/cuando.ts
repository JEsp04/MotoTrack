const ZONA = 'America/Bogota';
/** Espacios especiales que Intl pone antes de «a. m.» (no separable y fino) */
const ESPACIOS_RAROS = new RegExp('[' + String.fromCharCode(0xa0, 0x202f) + ']', 'g');
const dia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA });
const hora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  hour: 'numeric',
  minute: '2-digit',
});
const fecha = new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, day: 'numeric', month: 'short' });

/**
 * Cuándo llegó un aviso, en hora de Colombia, como en el prototipo:
 * «Hoy · 9:40 a. m.», «Ayer · 4:15 p. m.» o «15 sep».
 */
export function cuandoAviso(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  // Intl separa «a. m.» con espacios especiales; se dejan normales
  const h = hora.format(d).replace(ESPACIOS_RAROS, ' ');
  if (dia.format(d) === dia.format(ahora)) return `Hoy · ${h}`;
  const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  if (dia.format(d) === dia.format(ayer)) return `Ayer · ${h}`;
  return fecha.format(d).replace('.', '').replace(' de ', ' ');
}
