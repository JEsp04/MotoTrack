import { Router } from 'express';
import asistenteRoutes from './modules/asistente/asistente.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import avisosRoutes from './modules/avisos/avisos.routes.js';
import citasRoutes from './modules/citas/citas.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import invitacionesRoutes from './modules/invitaciones/invitaciones.routes.js';
import motosRoutes from './modules/motos/motos.routes.js';
import ordenesRoutes from './modules/ordenes/ordenes.routes.js';
import repuestosRoutes from './modules/repuestos/repuestos.routes.js';
import resenasRoutes from './modules/resenas/resenas.routes.js';
import suscripcionRoutes from './modules/suscripcion/suscripcion.routes.js';
import serviciosRoutes from './modules/servicios/servicios.routes.js';
import talleresRoutes from './modules/talleres/talleres.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/talleres', talleresRoutes);
// Cada módulo aplica requireAuth y requireRole en su propio archivo de rutas
router.use('/usuarios', usuariosRoutes);
router.use('/invitaciones', invitacionesRoutes);
router.use('/clientes', clientesRoutes);
router.use('/motos', motosRoutes);
router.use('/ordenes', ordenesRoutes);
router.use('/servicios', serviciosRoutes);
router.use('/repuestos', repuestosRoutes);
router.use('/citas', citasRoutes);
router.use('/avisos', avisosRoutes);
router.use('/resenas', resenasRoutes);
router.use('/asistente', asistenteRoutes);
router.use('/suscripcion', suscripcionRoutes);

export default router;
