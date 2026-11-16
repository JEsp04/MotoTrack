import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as talleres from './talleres.controller.js';

/** /api/talleres */
const router = Router();

router.get('/publicos', talleres.publicos);
// HU-73 · Datos del taller: todos los del taller los ven; solo el admin los cambia
router.get('/mio', requireAuth, talleres.obtenerMio);
router.patch('/mio', requireAuth, requireRole('admin'), talleres.actualizarMio);

export default router;
