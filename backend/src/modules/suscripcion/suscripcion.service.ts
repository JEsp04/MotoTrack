import { prisma } from '../../config/prisma.js';
import type { PlanTaller, Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import { desglose, hoyColombia, numeroFactura, PLANES } from './suscripcion.planes.js';
import type { CambiarPlanInput } from './suscripcion.schemas.js';

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

/**
 * PATCH /api/suscripcion/plan (HU-80) · El cambio aplica desde hoy y el próximo cobro
 * (la próxima factura) sale con el precio del plan nuevo. La fecha de cobro no cambia.
 * Un taller sin plan queda con ese plan y su primer cobro hoy.
 */
export async function cambiarPlan(tallerId: number, { plan }: CambiarPlanInput) {
  const actual = await prisma.suscripcion.findUnique({ where: { tallerId } });
  if (actual?.plan === plan) {
    throw HttpError.conflict(`Tu taller ya tiene el plan ${PLANES[plan].nombre}`);
  }
  const ahora = new Date();
  await prisma.suscripcion.upsert({
    where: { tallerId },
    create: { tallerId, plan, planDesde: ahora, proximoCobro: hoyColombia(ahora) },
    update: { plan, planDesde: ahora },
  });
  return obtener(tallerId);
}
