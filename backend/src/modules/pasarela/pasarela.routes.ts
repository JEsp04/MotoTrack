import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as pasarela from './pasarela.controller.js';

/**
 * /api/pasarela (HU-81) · Pasarela de pagos simulada para la demo (tarjeta de prueba, sin
 * cobro real). En producción se cambia por el formulario de una pasarela certificada.
 */
const router = Router();

router.use(requireAuth, requireRole('admin'));
router.post('/transacciones', pasarela.crearTransaccion);

export default router;
