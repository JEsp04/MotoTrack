import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { usuarioActual } from '../../middlewares/auth.js';
import { actualizarTallerSchema } from './talleres.schemas.js';
import * as talleresService from './talleres.service.js';

/**
 * Lista pública de talleres activos, para que el cliente elija el suyo al registrarse (HU-20).
 * Solo datos públicos: publicId, nombre y dirección.
 */
export async function publicos(_req: Request, res: Response) {
  const talleres = await prisma.taller.findMany({
    where: { estado: 'activo' },
    select: { publicId: true, nombre: true, direccion: true },
    orderBy: { nombre: 'asc' },
  });
  res.json({ data: talleres });
}

export async function obtenerMio(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  res.json({ data: await talleresService.obtenerMiTaller(tallerId) });
}

export async function actualizarMio(req: Request, res: Response) {
  const { tallerId } = usuarioActual(req);
  const input = actualizarTallerSchema.parse(req.body);
  res.json({ data: await talleresService.actualizarMiTaller(tallerId, input) });
}
