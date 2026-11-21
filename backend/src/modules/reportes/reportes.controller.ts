import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { reporteSchema } from './reportes.schemas.js';
import { exportarOrdenes } from './reportes.csv.js';
import * as reportesService from './reportes.service.js';

/** GET /api/reportes */
export async function ver(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = reporteSchema.parse(req.query);
  res.json({ data: await reportesService.reporte(tallerId, query) });
}

/** GET /api/reportes/ordenes · Descarga el CSV de las órdenes del periodo (HU-72) */
export async function exportar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = reporteSchema.parse(req.query);
  const { contenido, nombre } = await exportarOrdenes(tallerId, query);
  res.status(200).type('text/csv; charset=utf-8').attachment(nombre).send(contenido);
}
