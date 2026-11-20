import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as resenas from './resenas.controller.js';

/**
 * /api/resenas (HU-89). Solo el admin: lista con promedio y responde. :id es el publicId.
 * El cliente califica con POST /api/ordenes/:id/resena (en ordenes.routes.ts).
 */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', resenas.listar);
router.patch('/:id', resenas.actualizar);

export default router;
