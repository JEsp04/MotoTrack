import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { reporteSchema } from './reportes.schemas.js';
import * as reportesService from './reportes.service.js';

/** GET /api/reportes */
export async function ver(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = reporteSchema.parse(req.query);
  res.json({ data: await reportesService.reporte(tallerId, query) });
}
