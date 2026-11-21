import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { PLANES } from '../suscripcion/suscripcion.planes.js';
import { firmarResultado } from './pasarela.firma.js';
import type { ResultadoPasarela, TransaccionInput } from './pasarela.schemas.js';
import { enmascarar, rechazadaPorElBanco } from './pasarela.tarjeta.js';

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** «MT-7K2Q9XHD» */
function nuevaReferencia() {
  return `MT-${Array.from(randomBytes(8), (b) => LETRAS[b % LETRAS.length]).join('')}`;
}

/**
 * POST /api/pasarela/transacciones (HU-81) · Pasarela de pagos SIMULADA: no cobra nada.
 * Hace lo que haría la pasarela real: valida la tarjeta, aprueba o rechaza y firma el
 * resultado. De la tarjeta no se guarda nada aquí; solo viaja «Visa •••• 4242» en el resultado.
 * El cambio en la suscripción lo hace /api/suscripcion/pagos al verificar la firma.
 */
export async function crearTransaccion(tallerId: number, input: TransaccionInput) {
  const taller = await prisma.taller.findUnique({
    where: { tallerId },
    select: { publicId: true },
  });
  if (!taller) throw HttpError.notFound('No encontramos tu taller');

  const numero = input.tarjeta.numero;
  const rechazada = rechazadaPorElBanco(numero);
  const resultado: ResultadoPasarela = {
    referencia: nuevaReferencia(),
    taller: taller.publicId,
    tipo: input.tipo,
    plan: input.tipo === 'plan' ? input.plan : null,
    // El valor lo pone el servidor, nunca el navegador
    monto: input.tipo === 'plan' ? PLANES[input.plan].precio : 0,
    medio: enmascarar(numero),
    estado: rechazada ? 'rechazada' : 'aprobada',
    motivo: !rechazada
      ? null
      : input.tipo === 'metodo'
        ? 'Tu banco no autorizó esta tarjeta. Prueba con otra o comunícate con tu banco.'
        : 'Fondos insuficientes. Tu banco rechazó la transacción.',
    fecha: new Date().toISOString(),
  };
  return { resultado, token: firmarResultado(resultado) };
}
