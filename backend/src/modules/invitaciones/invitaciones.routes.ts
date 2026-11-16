import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as invitaciones from './invitaciones.controller.js';

/**
 * /api/invitaciones (HU-67). :id es el publicId.
 * Validar un código es público (pantalla «Únete a tu taller»); lo demás es solo del admin.
 * La cuenta se crea con POST /api/auth/register-invitacion.
 */
const router = Router();

router.get('/codigo/:codigo', invitaciones.validar);

router.use(requireAuth, requireRole('admin'));
router.get('/', invitaciones.listar);
router.post('/', invitaciones.crear);
router.post('/:id/reenviar', invitaciones.reenviar);
router.post('/:id/cancelar', invitaciones.cancelar);

export default router;
