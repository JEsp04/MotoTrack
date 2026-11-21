import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';

/**
 * HU-81 · Firma de la pasarela. El resultado viaja por el navegador como un token
 * «datos.firma» (HMAC-SHA256 con PASARELA_SECRETO): el backend solo lo aplica si la firma
 * cuadra, así nadie puede inventarse un pago aprobado.
 */
const firmar = (datos: string) =>
  createHmac('sha256', env.PASARELA_SECRETO).update(datos).digest('base64url');

export function firmarResultado(resultado: object) {
  const datos = Buffer.from(JSON.stringify(resultado)).toString('base64url');
  return `${datos}.${firmar(datos)}`;
}

/** Devuelve el contenido si la firma es válida; si no, null */
export function verificarResultado(token: string): unknown {
  const [datos, firma, sobra] = token.split('.');
  if (!datos || !firma || sobra !== undefined) return null;
  const esperada = Buffer.from(firmar(datos));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  try {
    return JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as unknown;
  } catch {
    return null;
  }
}
