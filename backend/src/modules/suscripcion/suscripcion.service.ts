import { prisma } from '../../config/prisma.js';
import type { PlanTaller, Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { verificarResultado } from '../pasarela/pasarela.firma.js';
import { resultadoSchema } from '../pasarela/pasarela.schemas.js';
import {
  desglose,
  hoyColombia,
  mesSiguiente,
  numeroFactura,
  PLANES,
} from './suscripcion.planes.js';
import type { ConfirmarPagoInput } from './suscripcion.schemas.js';

const facturaSelect = {
  publicId: true,
  numero: true,
  plan: true,
  subtotal: true,
  iva: true,
  total: true,
  medioPago: true,
  referencia: true,
  fecha: true,
} satisfies Prisma.FacturaSelect;

type FacturaFila = Prisma.FacturaGetPayload<{ select: typeof facturaSelect }>;

const aFactura = (f: FacturaFila) => ({ ...f, numero: numeroFactura(f.numero) });

/** Lo que verá el admin: el plan, el próximo cobro con su desglose y las facturas. */
function aRespuesta(
  suscripcion: {
    plan: PlanTaller;
    planDesde: Date;
    proximoCobro: Date;
    medioPago: string | null;
  } | null,
  facturas: FacturaFila[],
) {
  return {
    suscripcion: suscripcion && {
      plan: suscripcion.plan,
      nombre: PLANES[suscripcion.plan].nombre,
      precio: PLANES[suscripcion.plan].precio,
      estado: 'activa' as const,
      planDesde: suscripcion.planDesde,
      proximoCobro: suscripcion.proximoCobro.toISOString().slice(0, 10),
      medioPago: suscripcion.medioPago,
      // El próximo cobro siempre usa el precio del plan actual
      proximaFactura: { plan: suscripcion.plan, ...desglose(PLANES[suscripcion.plan].precio) },
    },
    facturas: facturas.map(aFactura),
  };
}

/** GET /api/suscripcion (HU-80) · Plan del taller y sus últimas facturas (más nuevas primero) */
export async function obtener(tallerId: number) {
  const [suscripcion, facturas] = await Promise.all([
    prisma.suscripcion.findUnique({ where: { tallerId } }),
    prisma.factura.findMany({
      where: { tallerId },
      orderBy: { numero: 'desc' },
      take: 24,
      select: facturaSelect,
    }),
  ]);
  return aRespuesta(suscripcion, facturas);
}

/** Más de esto y la confirmación se considera vieja: hay que pagar de nuevo */
const VIGENCIA_CONFIRMACION_MS = 30 * 60 * 1000;

const confirmacionInvalida = () =>
  HttpError.badRequest('La confirmación de la pasarela no es válida. Intenta el pago de nuevo.');

/**
 * POST /api/suscripcion/pagos (HU-81) · Aplica el resultado de la pasarela, solo si su firma
 * es válida y es de este taller.
 * - «plan»: factura pagada con el siguiente consecutivo, el plan queda activo desde hoy y se
 *   renueva el mismo día de cada mes.
 * - «metodo»: solo cambia la tarjeta; no hay cobro.
 */
export async function confirmarPago(tallerId: number, { token }: ConfirmarPagoInput) {
  const leido = resultadoSchema.safeParse(verificarResultado(token));
  if (!leido.success) throw confirmacionInvalida();
  const pago = leido.data;

  const taller = await prisma.taller.findUnique({
    where: { tallerId },
    select: { publicId: true },
  });
  if (taller?.publicId !== pago.taller) throw confirmacionInvalida();
  if (Date.now() - Date.parse(pago.fecha) > VIGENCIA_CONFIRMACION_MS) {
    throw HttpError.badRequest('La confirmación de la pasarela venció. Intenta el pago de nuevo.');
  }
  if (pago.estado !== 'aprobada') {
    throw HttpError.conflict(pago.motivo ?? 'La pasarela rechazó el pago');
  }

  if (pago.tipo === 'metodo') {
    const { count } = await prisma.suscripcion.updateMany({
      where: { tallerId },
      data: { medioPago: pago.medio },
    });
    if (count === 0) throw HttpError.conflict('Tu taller aún no tiene un plan');
    return obtener(tallerId);
  }

  const plan = pago.plan;
  if (!plan || pago.monto !== PLANES[plan].precio) throw confirmacionInvalida();
  const ahora = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const ultima = await tx.factura.findFirst({
        where: { tallerId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      await tx.factura.create({
        data: {
          tallerId,
          numero: (ultima?.numero ?? 0) + 1,
          plan,
          ...desglose(pago.monto),
          medioPago: pago.medio,
          referencia: pago.referencia,
          fecha: ahora,
        },
      });
      const datos = {
        plan,
        planDesde: ahora,
        proximoCobro: mesSiguiente(hoyColombia(ahora)),
        medioPago: pago.medio,
      };
      await tx.suscripcion.upsert({
        where: { tallerId },
        create: { tallerId, ...datos },
        update: datos,
      });
    });
  } catch (error) {
    // La misma confirmación enviada dos veces: el pago ya quedó aplicado
    if (esDuplicado(error, 'referencia')) throw HttpError.conflict('Este pago ya se aplicó');
    throw error;
  }
  return obtener(tallerId);
}
