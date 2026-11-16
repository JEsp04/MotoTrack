import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { listarAvisosSchema } from './avisos.schemas.js';
import * as avisosService from './avisos.service.js';

export async function listar(req: Request, res: Response) {
  const query = listarAvisosSchema.parse(req.query);
  res.json(await avisosService.listarAvisos(usuarioActual(req), query));
}

export async function leido(req: Request<{ id: string }>, res: Response) {
  res.json({ data: await avisosService.marcarLeido(usuarioActual(req), req.params.id) });
}

export async function leerTodos(req: Request, res: Response) {
  res.json({ data: await avisosService.leerTodos(usuarioActual(req)) });
}
