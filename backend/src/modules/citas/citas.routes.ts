import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as citas from './citas.controller.js';

/**
 * /api/citas (HU-57). :id es el publicId.
 * Admin y mecánico ven las del taller; el cliente solo las suyas.
 * Crean y cambian citas el admin (cualquiera del taller) y el cliente (las suyas).
 * El mecánico solo consulta.
 */
const router = Router();

router.use(requireAuth);
router.get('/', citas.listar);
// Antes de /:id para que «horas-libres» no se tome como un id
router.get('/horas-libres', citas.horasLibres);
router.get('/:id', citas.obtener);
router.post('/', requireRole('admin', 'cliente'), citas.crear);
router.patch('/:id', requireRole('admin', 'cliente'), citas.actualizar);

export default router;
