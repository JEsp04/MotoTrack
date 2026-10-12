import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as ordenes from './ordenes.controller.js';

/**
 * /api/ordenes (HU-28 a HU-37). :id es el publicId de la orden.
 * Quién puede hacer cada cambio de estado lo decide estados.ts, no estas rutas.
 */
const router = Router();

router.use(requireAuth);
router.get('/', ordenes.listar);
router.get('/:id', ordenes.obtener);
router.post('/', requireRole('admin'), ordenes.crear);
router.patch('/:id/estado', ordenes.cambiarEstado);
router.post('/:id/diagnostico', requireRole('mecanico'), ordenes.diagnostico);
router.post('/:id/servicios', requireRole('admin', 'mecanico'), ordenes.agregarServicio);
router.delete(
  '/:id/servicios/:detalleId',
  requireRole('admin', 'mecanico'),
  ordenes.quitarServicio,
);

export default router;
