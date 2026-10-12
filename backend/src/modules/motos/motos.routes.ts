import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as motos from './motos.controller.js';

/**
 * /api/motos (HU-26, HU-27). :id es el publicId.
 * El cliente ve, crea y edita solo las suyas; el mecánico solo consulta.
 */
const router = Router();

router.use(requireAuth);
router.get('/', motos.listar);
router.post('/', requireRole('admin', 'cliente'), motos.crear);
router.patch('/:id', requireRole('admin', 'cliente'), motos.actualizar);

export default router;
