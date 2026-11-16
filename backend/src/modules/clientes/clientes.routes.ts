import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as clientes from './clientes.controller.js';

/**
 * /api/clientes (HU-24, HU-25). :id es el publicId.
 * Admin y mecánico consultan; solo el admin crea y edita.
 */
const router = Router();

router.use(requireAuth, requireRole('admin', 'mecanico'));
router.get('/', clientes.listar);
router.get('/:id', clientes.obtener);
router.post('/', requireRole('admin'), clientes.crear);
router.patch('/:id', requireRole('admin'), clientes.actualizar);

export default router;
