import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

// Aquí se montan los módulos a medida que se crean, por ejemplo:
// router.use('/auth', authRoutes);
// router.use('/clientes', clientesRoutes);

export default router;
