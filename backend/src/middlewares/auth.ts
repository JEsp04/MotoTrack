import type { RequestHandler } from 'express';
import type { Rol } from '../generated/prisma/client.js';
import { verificarAccessToken } from '../modules/auth/auth.tokens.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Exige un token de acceso válido en "Authorization: Bearer <token>" (HU-18).
 * Deja en req.user { usuarioId, rol, tallerId }.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [tipo, token] = header.split(' ');
  if (tipo !== 'Bearer' || !token) throw HttpError.unauthorized('Debes iniciar sesión');
  req.user = verificarAccessToken(token);
  next();
};

/** Deja pasar solo a los roles indicados. Usar después de requireAuth. */
export function requireRole(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw HttpError.unauthorized('Debes iniciar sesión');
    if (!roles.includes(req.user.rol)) throw HttpError.forbidden();
    next();
  };
}

/** Usuario autenticado de la petición (después de requireAuth). */
export function usuarioActual(req: Parameters<RequestHandler>[0]) {
  if (!req.user) throw HttpError.unauthorized('Debes iniciar sesión');
  return req.user;
}
