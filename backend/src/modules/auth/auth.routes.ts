import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as auth from './auth.controller.js';

/** /api/auth (docs/CONTEXTO.md, sección 6) */
const router = Router();

router.post('/register-taller', auth.registerTaller);
router.post('/register', auth.register);
router.post('/register-invitacion', auth.registerInvitacion);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
// HU-86 · Autogestión de la cuenta
router.patch('/perfil', requireAuth, auth.actualizarPerfil);
router.patch('/password', requireAuth, auth.cambiarPassword);
// HU-91 · El cliente en varios talleres
router.get('/talleres', requireAuth, requireRole('cliente'), auth.talleres);
router.post('/talleres', requireAuth, requireRole('cliente'), auth.vincularTaller);
router.post('/taller-activo', requireAuth, requireRole('cliente'), auth.cambiarTallerActivo);

export default router;
