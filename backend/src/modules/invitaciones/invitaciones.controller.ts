import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { codigoSchema, crearInvitacionSchema } from './invitaciones.schemas.js';
import * as invitacionesService from './invitaciones.service.js';

export async function listar(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await invitacionesService.listarInvitaciones(tallerId) });
}

export async function crear(req: Request, res: Response) {
  const input = crearInvitacionSchema.parse(req.body);
  res
    .status(201)
    .json({ data: await invitacionesService.crearInvitacion(usuarioActual(req), input) });
}

export async function reenviar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await invitacionesService.reenviarInvitacion(tallerId, req.params.id) });
}

export async function cancelar(req: Request<{ id: string }>, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await invitacionesService.cancelarInvitacion(tallerId, req.params.id) });
}

export async function validar(req: Request<{ codigo: string }>, res: Response) {
  const codigo = codigoSchema.parse(req.params.codigo);
  res.json({ data: await invitacionesService.validarCodigo(codigo, req.ip ?? '') });
}
