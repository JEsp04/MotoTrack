import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import routes from './routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Confía en 1 proxy inverso (ej. Vercel) para leer la IP real en req.ip sin aceptar cadenas falsas
  app.set('trust proxy', 1);
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
