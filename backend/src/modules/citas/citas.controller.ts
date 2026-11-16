import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import {
  actualizarCitaSchema,
  crearCitaSchema,
  horasLibresSchema,
  listarCitasSchema,
} from './citas.schemas.js';
import * as citasService from './citas.service.js';

export async function listar(req: Request, res: Response) {
  const usuario = usuarioActual(req);
  const query = listarCitasSchema.parse(req.query);
  res.json(await citasService.listarCitas(usuario, query));
}

export async function horasLibres(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const { fecha } = horasLibresSchema.parse(req.query);
  res.json({ data: await citasService.horasLibres(tallerId, fecha) });
}

export async function obtener(req: Request<{ id: string }>, res: Response) {
  const usuario = usuarioActual(req);
  res.json({ data: await citasService.obtenerCita(usuario, req.params.id) });
}

export async function crear(req: Request, res: Response) {
  const usuario = usuarioActual(req);
  const input = crearCitaSchema.parse(req.body);
  res.status(201).json({ data: await citasService.crearCita(usuario, input) });
}

export async function actualizar(req: Request<{ id: string }>, res: Response) {
  const usuario = usuarioActual(req);
  const input = actualizarCitaSchema.parse(req.body);
  res.json({ data: await citasService.actualizarCita(usuario, req.params.id, input) });
}
