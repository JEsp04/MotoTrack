import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { DIAS_SEMANA, desdeDia, diaLocal, diaSemana, rangos, type Rango } from './periodo.js';
import type { ReporteQuery } from './reportes.schemas.js';

/**
 * Una orden cuenta como cerrada en el reporte cuando la moto se entregó (entregada o
 * cerrada): ahí el taller cobra. Su día es el de la entrega, en hora de Colombia.
 */
const TERMINADAS = ['entregada', 'cerrada'] as const;

/** Cuántos servicios se muestran en «Servicios más frecuentes» (como en el prototipo) */
const TOP_SERVICIOS = 4;

const terminadasEn = (tallerId: number, r: Rango): Prisma.OrdenServicioWhereInput => ({
  tallerId,
  estado: { in: [...TERMINADAS] },
  fechaEntrega: { gte: r.desde, lt: r.hasta },
});

/**
 * HU-71 · GET /api/reportes · Indicadores del taller en la semana o el mes:
 * ingresos (suma de `costoTotal`), órdenes cerradas, días promedio de ingreso a entrega,
 * comparación con el periodo anterior, órdenes por día y servicios más frecuentes.
 */
export async function reporte(tallerId: number, query: ReporteQuery, ahora = new Date()) {
  const referencia = query.fecha ? desdeDia(query.fecha) : ahora;
  const { actual, anterior, nombreAnterior } = rangos(query.periodo, referencia);

  const [ordenes, previas] = await Promise.all([
    prisma.ordenServicio.findMany({
      where: terminadasEn(tallerId, actual),
      select: {
        costoTotal: true,
        fechaIngreso: true,
        fechaEntrega: true,
        servicios: { select: { servicio: { select: { nombre: true } } } },
      },
    }),
    prisma.ordenServicio.aggregate({
      where: terminadasEn(tallerId, anterior),
      _sum: { costoTotal: true },
      _count: true,
    }),
  ]);

  const ingresos = ordenes.reduce((s, o) => s + o.costoTotal, 0);
  const ingresosAnterior = previas._sum.costoTotal ?? 0;

  const dias = ordenes.map((o) => (o.fechaEntrega!.getTime() - o.fechaIngreso.getTime()) / 864e5);
  const diasPromedio = dias.length
    ? Math.round((dias.reduce((s, d) => s + d, 0) / dias.length) * 10) / 10
    : null;

  // Órdenes por día de la semana (Lun a Sáb siempre; Dom solo si hubo entregas)
  const conteo = DIAS_SEMANA.map(() => 0);
  for (const o of ordenes) conteo[diaSemana(o.fechaEntrega!)]!++;
  const porDia = DIAS_SEMANA.map((dia, i) => ({ dia, ordenes: conteo[i]! })).filter(
    (d) => d.dia !== 'Dom' || d.ordenes > 0,
  );

  // Servicios más frecuentes: en cuántas órdenes aparece cada servicio del catálogo
  const veces = new Map<string, number>();
  for (const o of ordenes) {
    const nombres = new Set(o.servicios.flatMap((d) => (d.servicio ? [d.servicio.nombre] : [])));
    for (const n of nombres) veces.set(n, (veces.get(n) ?? 0) + 1);
  }
  const servicios = [...veces]
    .map(([nombre, n]) => ({ nombre, veces: n }))
    .sort((a, b) => b.veces - a.veces || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, TOP_SERVICIOS);

  return {
    periodo: query.periodo,
    desde: diaLocal(actual.desde),
    hasta: diaLocal(new Date(actual.hasta.getTime() - 1)),
    ingresos,
    ordenesCerradas: ordenes.length,
    diasPromedio,
    anterior: {
      nombre: nombreAnterior,
      ingresos: ingresosAnterior,
      ordenesCerradas: previas._count,
      /** Cambio de los ingresos en %, o null si el periodo anterior no tuvo ingresos */
      variacionIngresos: ingresosAnterior
        ? Math.round(((ingresos - ingresosAnterior) / ingresosAnterior) * 100)
        : null,
    },
    porDia,
    servicios,
  };
}
