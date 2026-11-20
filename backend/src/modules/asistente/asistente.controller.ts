import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { consultarSchema } from './asistente.schemas.js';
import * as asistenteService from './asistente.service.js';

export async function estado(req: Request, res: Response) {
  res.json({ data: await asistenteService.estado(usuarioActual(req)) });
}

export async function consultar(req: Request, res: Response) {
  const input = consultarSchema.parse(req.body);
  res.json({ data: await asistenteService.consultar(usuarioActual(req), input) });
}
