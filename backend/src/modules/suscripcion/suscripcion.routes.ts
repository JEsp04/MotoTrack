import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as suscripcion from './suscripcion.controller.js';

/** /api/suscripcion (HU-80) · Plan de MotoTrack del taller y sus facturas. Solo el admin. */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', suscripcion.obtener);
router.patch('/plan', suscripcion.cambiarPlan);

export default router;
