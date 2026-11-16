import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as clientes from './clientes.controller.js';

/**
 * /api/clientes (HU-24, HU-25). :id es el publicId.
 * Solo el admin consulta, crea y edita clientes; el mecánico no ve clientes (contexto.md).
 */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', clientes.listar);
router.get('/:id', clientes.obtener);
router.post('/', clientes.crear);
router.patch('/:id', clientes.actualizar);

export default router;
