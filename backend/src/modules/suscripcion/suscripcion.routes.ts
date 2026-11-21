import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as suscripcion from './suscripcion.controller.js';

/**
 * /api/suscripcion · Plan de MotoTrack del taller y sus facturas (HU-80), y los pagos con la
 * pasarela (HU-81). Solo el admin.
 */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', suscripcion.obtener);
router.post('/pagos', suscripcion.confirmarPago);

export default router;
