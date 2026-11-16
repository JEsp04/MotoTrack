import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  actualizarRepuestoSchema,
  crearRepuestoSchema,
  listarRepuestosSchema,
  registrarMovimientoSchema,
} from './repuestos.schemas.js';
import * as repuestosService from './repuestos.service.js';

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = listarRepuestosSchema.parse(req.query);
  res.json(await repuestosService.listarRepuestos(tallerId, query));
}

export async function obtener(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await repuestosService.obtenerRepuesto(tallerId, req.params.id) });
}

export async function crear(req: Request, res: Response) {
  const usuario = usuarioActual(req);
  const input = crearRepuestoSchema.parse(req.body);
  res.status(201).json({ data: await repuestosService.crearRepuesto(usuario, input) });
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = actualizarRepuestoSchema.parse(req.body);
  res.json({ data: await repuestosService.actualizarRepuesto(tallerId, req.params.id, input) });
}

export async function registrarMovimiento(req: Request<{ id: string }>, res: Response) {
  const usuario = usuarioActual(req);
  const input = registrarMovimientoSchema.parse(req.body);
  res
    .status(201)
    .json({ data: await repuestosService.registrarMovimiento(usuario, req.params.id, input) });
}
