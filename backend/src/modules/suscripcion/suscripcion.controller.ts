import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { cambiarPlanSchema } from './suscripcion.schemas.js';
import * as suscripcionService from './suscripcion.service.js';

export async function obtener(req: Request, res: Response) {
  res.json({ data: await suscripcionService.obtener(usuarioActual(req).tallerId) });
}

export async function cambiarPlan(req: Request, res: Response) {
  const input = cambiarPlanSchema.parse(req.body);
  res.json({ data: await suscripcionService.cambiarPlan(usuarioActual(req).tallerId, input) });
}
