import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as repuestos from './repuestos.controller.js';

/**
 * /api/repuestos (HU-52). :id es el publicId.
 * Admin y mecánico consultan; solo el admin crea y edita.
 */
const router = Router();

router.use(requireAuth, requireRole('admin', 'mecanico'));
router.get('/', repuestos.listar);
router.get('/:id', repuestos.obtener);
router.post('/', requireRole('admin'), repuestos.crear);
router.patch('/:id', requireRole('admin'), repuestos.actualizar);

export default router;
