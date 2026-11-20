import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  actualizarResenaSchema,
  crearResenaSchema,
  listarResenasSchema,
} from './resenas.schemas.js';
import * as resenasService from './resenas.service.js';

/** POST /api/ordenes/:id/resena (cliente dueño) */
export async function crear(req: Request<{ id: string }>, res: Response) {
  const input = crearResenaSchema.parse(req.body);
  res
    .status(201)
    .json({ data: await resenasService.crearResena(usuarioActual(req), req.params.id, input) });
}

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = listarResenasSchema.parse(req.query);
  res.json(await resenasService.listarResenas(tallerId, query));
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = actualizarResenaSchema.parse(req.body);
  res.json({ data: await resenasService.actualizarResena(tallerId, req.params.id, input) });
}
