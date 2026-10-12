import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requireRole, usuarioActual } from '../../middlewares/auth.js';

/** /api/servicios · Catálogo de servicios activos del taller (HU-33) */
const router = Router();

router.get('/', requireAuth, requireRole('admin', 'mecanico'), async (req, res) => {
  const { tallerId } = usuarioActual(req);
  const servicios = await prisma.servicio.findMany({
    where: { tallerId, estado: 'activo' },
    select: {
      publicId: true,
      nombre: true,
      descripcion: true,
      precioBase: true,
      tiempoEstimadoMin: true,
    },
    orderBy: { nombre: 'asc' },
  });
  res.json({ data: servicios });
});

export default router;
