// Datos del usuario autenticado que deja el middleware de auth en req.user (HU-18)
import type { Rol } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      user?: { usuarioId: number; rol: Rol; tallerId: number };
    }
  }
}

export {};
