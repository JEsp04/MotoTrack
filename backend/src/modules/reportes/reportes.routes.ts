import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as reportes from './reportes.controller.js';

/** /api/reportes (HU-71 y HU-72). Solo el admin. */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', reportes.ver);
// HU-72 · Exportar a Excel (CSV)
router.get('/ordenes', reportes.exportar);

export default router;
