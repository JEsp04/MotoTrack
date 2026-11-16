import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as avisos from './avisos.controller.js';

/**
 * /api/avisos (HU-69). Cada usuario (admin, mecánico o cliente) ve y marca solo los suyos.
 * :id es el publicId.
 */
const router = Router();

router.use(requireAuth);
router.get('/', avisos.listar);
router.post('/leer-todos', avisos.leerTodos);
router.patch('/:id/leido', avisos.leido);

export default router;
