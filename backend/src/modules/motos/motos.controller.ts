import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { actualizarMotoSchema, crearMotoSchema, listarMotosSchema } from './motos.schemas.js';
import * as motosService from './motos.service.js';

export async function listar(req: Request, res: Response) {
  const query = listarMotosSchema.parse(req.query);
  res.json(await motosService.listarMotos(usuarioActual(req), query));
}

export async function crear(req: Request, res: Response) {
  const input = crearMotoSchema.parse(req.body);
  res.status(201).json({ data: await motosService.crearMoto(usuarioActual(req), input) });
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const input = actualizarMotoSchema.parse(req.body);
  res.json({
    data: await motosService.actualizarMoto(usuarioActual(req), req.params.id, input),
  });
}
