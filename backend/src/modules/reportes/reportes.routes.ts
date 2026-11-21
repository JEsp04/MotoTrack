import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as reportes from './reportes.controller.js';

/** /api/reportes (HU-71). Solo el admin. */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', reportes.ver);

export default router;
