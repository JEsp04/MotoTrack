import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import * as asistente from './asistente.controller.js';

/**
 * /api/asistente (HU-79) · Asistente IA de diagnóstico para el cliente y el personal del taller.
 * La llave de la API solo existe en el backend; el frontend nunca habla con el modelo.
 */
const router = Router();

router.use(requireAuth, requireRole('cliente', 'mecanico', 'admin'));
router.get('/', asistente.estado);
router.post('/consultas', asistente.consultar);

export default router;
