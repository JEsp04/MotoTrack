import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import motosRoutes from './modules/motos/motos.routes.js';
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
router.use('/clientes', clientesRoutes);
router.use('/motos', motosRoutes);

export default router;
