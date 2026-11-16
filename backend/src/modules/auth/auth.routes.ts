import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import * as auth from './auth.controller.js';

/** /api/auth (docs/CONTEXTO.md, sección 6) */
const router = Router();

router.post('/register-taller', auth.registerTaller);
router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

export default router;
