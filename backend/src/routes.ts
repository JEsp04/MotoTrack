import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import talleresRoutes from './modules/talleres/talleres.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/talleres', talleresRoutes);

// Los módulos siguientes se montan con requireAuth y requireRole, por ejemplo:
// router.use('/clientes', requireAuth, clientesRoutes);

export default router;
