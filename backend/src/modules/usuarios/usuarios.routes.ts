import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as usuarios from './usuarios.controller.js';

/** /api/usuarios · Equipo del taller (HU-23). Solo el admin. :id es el publicId. */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', usuarios.listar);
router.post('/', usuarios.crear);
router.patch('/:id', usuarios.actualizar);

export default router;
