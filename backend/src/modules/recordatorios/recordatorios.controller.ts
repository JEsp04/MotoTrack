import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { listarRecordatoriosSchema, rechazarSchema } from './recordatorios.schemas.js';
import * as recordatoriosService from './recordatorios.service.js';

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = listarRecordatoriosSchema.parse(req.query);
  res.json(await recordatoriosService.listar(tallerId, query));
}

export async function aprobar(req: Request<{ id: string }>, res: Response) {
  res.json({ data: await recordatoriosService.aprobar(usuarioActual(req), req.params.id) });
}

export async function rechazar(req: Request<{ id: string }>, res: Response) {
  const input = rechazarSchema.parse(req.body);
  res.json({
    data: await recordatoriosService.rechazar(usuarioActual(req), req.params.id, input),
  });
}
