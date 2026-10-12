import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  actualizarMecanicoSchema,
  crearMecanicoSchema,
  listarUsuariosSchema,
} from './usuarios.schemas.js';
import * as usuariosService from './usuarios.service.js';

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const { rol } = listarUsuariosSchema.parse(req.query);
  res.json({ data: await usuariosService.listarEquipo(tallerId, rol) });
}

export async function crear(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = crearMecanicoSchema.parse(req.body);
  res.status(201).json({ data: await usuariosService.crearMecanico(tallerId, input) });
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = actualizarMecanicoSchema.parse(req.body);
  res.json({ data: await usuariosService.actualizarMecanico(tallerId, req.params.id, input) });
}
