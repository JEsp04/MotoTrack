import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { confirmarPagoSchema } from './suscripcion.schemas.js';
import * as suscripcionService from './suscripcion.service.js';

export async function obtener(req: Request, res: Response) {
  res.json({ data: await suscripcionService.obtener(usuarioActual(req).tallerId) });
}

export async function confirmarPago(req: Request, res: Response) {
  const input = confirmarPagoSchema.parse(req.body);
  res.json({ data: await suscripcionService.confirmarPago(usuarioActual(req).tallerId, input) });
}
