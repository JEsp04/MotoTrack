import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { transaccionSchema } from './pasarela.schemas.js';
import * as pasarelaService from './pasarela.service.js';

export async function crearTransaccion(req: Request, res: Response) {
  const input = transaccionSchema.parse(req.body);
  res
    .status(201)
    .json({ data: await pasarelaService.crearTransaccion(usuarioActual(req).tallerId, input) });
}
