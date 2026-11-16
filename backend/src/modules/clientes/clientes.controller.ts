import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  actualizarClienteSchema,
  crearClienteSchema,
  listarClientesSchema,
} from './clientes.schemas.js';
import * as clientesService from './clientes.service.js';

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const query = listarClientesSchema.parse(req.query);
  res.json(await clientesService.listarClientes(tallerId, query));
}

export async function obtener(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await clientesService.obtenerCliente(tallerId, req.params.id) });
}

export async function crear(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = crearClienteSchema.parse(req.body);
  res.status(201).json({ data: await clientesService.crearCliente(tallerId, input) });
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = actualizarClienteSchema.parse(req.body);
  res.json({ data: await clientesService.actualizarCliente(tallerId, req.params.id, input) });
}
