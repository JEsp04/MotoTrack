import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as resenas from '../resenas/resenas.controller.js';
import * as ordenes from './ordenes.controller.js';

/**
 * /api/ordenes (HU-28 a HU-37). :id es el publicId de la orden.
 * Quién puede hacer cada cambio de estado lo decide estados.ts, no estas rutas.
 */
const router = Router();

// HU-90 · El enlace /s/:id que se comparte por WhatsApp se abre sin sesión
router.get('/seguimiento/:id', ordenes.seguimiento);

router.use(requireAuth);
router.get('/', ordenes.listar);
// HU-85 · Antes de /:id para que «actividad» no se lea como un id
router.get('/actividad', ordenes.actividad);
router.get('/:id', ordenes.obtener);
router.post('/', requireRole('admin'), ordenes.crear);
router.patch('/:id/estado', ordenes.cambiarEstado);
router.post('/:id/retiro', requireRole('admin'), ordenes.retiro);
router.patch('/:id/entrega', requireRole('admin'), ordenes.fechaEntrega);
router.post('/:id/diagnostico', requireRole('mecanico'), ordenes.diagnostico);
router.post('/:id/servicios', requireRole('admin', 'mecanico'), ordenes.agregarServicio);
router.delete(
  '/:id/servicios/:detalleId',
  requireRole('admin', 'mecanico'),
  ordenes.quitarServicio,
);
// HU-89 · El cliente dueño califica el servicio al entregar o cerrar la orden
router.post('/:id/resena', requireRole('cliente'), resenas.crear);

export default router;
