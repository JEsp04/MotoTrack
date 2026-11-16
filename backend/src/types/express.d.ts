// Datos del usuario autenticado que deja el middleware de auth en req.user (HU-18)
import type { Rol } from '../generated/prisma/client.js';

/** Lo que viaja dentro del token de acceso. Son los Int internos: nunca se responden. */
export interface UsuarioAutenticado {
  usuarioId: number;
  rol: Rol;
  tallerId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioAutenticado;
    }
  }
}
