import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as recordatorios from './recordatorios.controller.js';

/** /api/recordatorios (HU-75). Solo el admin. :id es el publicId. */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', recordatorios.listar);
router.post('/:id/aprobar', recordatorios.aprobar);
router.post('/:id/rechazar', recordatorios.rechazar);

export default router;
