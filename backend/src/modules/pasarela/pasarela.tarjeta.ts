/** HU-81 · Reglas de tarjeta de la pasarela simulada (las mismas del prototipo). */

export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'American Express' | 'Diners Club';

/** Algoritmo de Luhn: detecta números de tarjeta mal escritos */
export function luhn(numero: string) {
  if (!/^\d{13,19}$/.test(numero)) return false;
  let suma = 0;
  let doble = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return suma % 10 === 0;
}

export function marca(numero: string): MarcaTarjeta | null {
  if (/^4/.test(numero)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(numero)) return 'Mastercard';
  if (/^3[47]/.test(numero)) return 'American Express';
  if (/^(36|38|30)/.test(numero)) return 'Diners Club';
  return null;
}

/** «MM/AA» vigente: vence al terminar ese mes (hora de Colombia) */
export function vigente(vence: string, ahora = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(vence);
  if (!m) return false;
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  const actual = local.getUTCFullYear() * 12 + local.getUTCMonth();
  return anio * 12 + (mes - 1) >= actual;
}

/** Lo único que se guarda de la tarjeta: «Visa •••• 4242» */
export const enmascarar = (numero: string) =>
  `${marca(numero) ?? 'Tarjeta'} •••• ${numero.slice(-4)}`;

/** Demo: las tarjetas terminadas en 0002 las rechaza el banco (como en el prototipo) */
export const rechazadaPorElBanco = (numero: string) => numero.endsWith('0002');
