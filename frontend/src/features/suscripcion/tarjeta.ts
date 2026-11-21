/** HU-81 · Reglas de la tarjeta (las mismas del backend y del prototipo) */

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

export function marca(numero: string) {
  if (/^4/.test(numero)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(numero)) return 'Mastercard';
  if (/^3[47]/.test(numero)) return 'American Express';
  if (/^(36|38|30)/.test(numero)) return 'Diners Club';
  return null;
}

/** «MM/AA» que aún no ha vencido (vence al terminar ese mes, hora de Colombia) */
export function vigente(vence: string, ahora = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(vence);
  if (!m) return false;
  const mes = Number(m[1]);
  if (mes < 1 || mes > 12) return false;
  const local = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  return (2000 + Number(m[2])) * 12 + mes - 1 >= local.getUTCFullYear() * 12 + local.getUTCMonth();
}

/** «4242424242» → «4242 4242 42» */
export const agruparNumero = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** «1228» → «12/28» */
export function formatoVence(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Tarjeta de prueba del prototipo («Demo: usar tarjeta de prueba») */
export const TARJETA_PRUEBA = {
  numero: '4242 4242 4242 4242',
  nombre: 'Andrés Salazar',
  vence: '12/28',
  cvv: '123',
};
