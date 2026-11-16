import { HttpError } from '../../utils/http-error.js';

/**
 * Freno contra quien prueba códigos al azar (HU-67). El código tiene solo 4 caracteres,
 * así que cada dirección IP tiene 10 intentos fallidos cada 15 minutos.
 * Vive en memoria: se reinicia cuando se reinicia la API, y eso basta para este uso.
 */
const MAX_FALLOS = 10;
const VENTANA_MS = 15 * 60 * 1000;
const fallos = new Map<string, { cuenta: number; desde: number }>();

function registro(ip: string) {
  const r = fallos.get(ip);
  if (!r || Date.now() - r.desde > VENTANA_MS) return null;
  return r;
}

/** Lanza 429 si esa IP ya agotó sus intentos */
export function revisarIntentos(ip: string) {
  if ((registro(ip)?.cuenta ?? 0) >= MAX_FALLOS) {
    throw new HttpError(
      429,
      'Hiciste muchos intentos con códigos que no existen. Espera 15 minutos e intenta de nuevo.',
    );
  }
}

export function sumarFallo(ip: string) {
  const r = registro(ip);
  if (r) r.cuenta += 1;
  else fallos.set(ip, { cuenta: 1, desde: Date.now() });
}

/** Solo para las pruebas: deja todos los contadores en cero */
export function reiniciarIntentos() {
  fallos.clear();
}
