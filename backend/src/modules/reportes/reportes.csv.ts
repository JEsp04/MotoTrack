import { prisma } from '../../config/prisma.js';
import { desdeDia, diaLocal, rangos } from './periodo.js';
import type { ReporteQuery } from './reportes.schemas.js';

/**
 * HU-72 · Archivo CSV que Excel abre bien en Colombia:
 * - UTF-8 con BOM, para que las tildes y la ñ se vean bien.
 * - Separado por punto y coma: con la configuración regional de Colombia (coma decimal), Excel
 *   usa «;» para separar columnas.
 * - Montos sin puntos ni signo de pesos, para que Excel los tome como números.
 */
const BOM = String.fromCharCode(0xfeff);
const SEP = ';';
const COLUMNAS = ['Número', 'Fecha de ingreso', 'Entrega', 'Placa', 'Cliente', 'Mecánico', 'Total'];

/** Colombia está 5 horas detrás de UTC todo el año */
const DESFASE_MS = 5 * 60 * 60 * 1000;

/** «2026-11-18 09:30» en hora de Colombia (Excel lo reconoce como fecha) */
function fechaHora(fecha: Date) {
  return new Date(fecha.getTime() - DESFASE_MS).toISOString().slice(0, 16).replace('T', ' ');
}

/**
 * Pone comillas si hace falta y evita que Excel ejecute una fórmula escrita en un nombre
 * (un texto que empieza por =, +, - o @).
 */
export function celda(valor: string | number): string {
  if (typeof valor === 'number') return String(valor);
  let v = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  if (/[";\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/**
 * GET /api/reportes/ordenes · Las órdenes del periodo (las mismas que suman en el reporte):
 * número, fecha de ingreso, entrega, placa, cliente, mecánico y total.
 */
export async function exportarOrdenes(tallerId: number, query: ReporteQuery, ahora = new Date()) {
  const referencia = query.fecha ? desdeDia(query.fecha) : ahora;
  const { actual } = rangos(query.periodo, referencia);

  const ordenes = await prisma.ordenServicio.findMany({
    where: {
      tallerId,
      estado: { in: ['entregada', 'cerrada'] },
      fechaEntrega: { gte: actual.desde, lt: actual.hasta },
    },
    orderBy: [{ fechaEntrega: 'asc' }, { numero: 'asc' }],
    select: {
      numero: true,
      fechaIngreso: true,
      fechaEntrega: true,
      costoTotal: true,
      moto: { select: { placa: true, cliente: { select: { nombre: true } } } },
      mecanico: { select: { nombre: true } },
    },
  });

  const filas = ordenes.map((o) =>
    [
      o.numero,
      fechaHora(o.fechaIngreso),
      fechaHora(o.fechaEntrega!),
      o.moto.placa,
      o.moto.cliente.nombre,
      o.mecanico.nombre,
      o.costoTotal,
    ]
      .map(celda)
      .join(SEP),
  );

  const contenido = BOM + [COLUMNAS.join(SEP), ...filas].join('\r\n') + '\r\n';
  const nombre =
    query.periodo === 'mes'
      ? `reporte-mes-${diaLocal(actual.desde).slice(0, 7)}.csv`
      : `reporte-semana-${diaLocal(actual.desde)}.csv`;
  return { contenido, nombre };
}
