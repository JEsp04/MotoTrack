import { Router } from 'express';
import { prisma } from '../../config/prisma.js';

/** /api/talleres */
const router = Router();

/**
 * Lista pública de talleres activos, para que el cliente elija el suyo al registrarse (HU-20).
 * Solo datos públicos: publicId, nombre y dirección.
 */
router.get('/publicos', async (_req, res) => {
  const talleres = await prisma.taller.findMany({
    where: { estado: 'activo' },
    select: { publicId: true, nombre: true, direccion: true },
    orderBy: { nombre: 'asc' },
  });
  res.json({ data: talleres });
});

export default router;
