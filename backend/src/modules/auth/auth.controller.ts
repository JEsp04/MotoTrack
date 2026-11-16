import type { Request, Response } from 'express';
import { usuarioActual } from '../../middlewares/auth.js';
import { loginSchema, registerClienteSchema, registerTallerSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { opcionesCookieRefresh, REFRESH_COOKIE } from './auth.tokens.js';

/** Deja la cookie de renovación y devuelve solo el token de acceso y el usuario. */
function responderSesion(res: Response, sesion: authService.Sesion, status = 200) {
  res.cookie(REFRESH_COOKIE, sesion.refreshToken, opcionesCookieRefresh());
  res.status(status).json({ data: { accessToken: sesion.accessToken, usuario: sesion.usuario } });
}

function leerCookie(req: Request): string | undefined {
  const valor: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof valor === 'string' && valor ? valor : undefined;
}

export async function registerTaller(req: Request, res: Response) {
  const input = registerTallerSchema.parse(req.body);
  responderSesion(res, await authService.registrarTaller(input), 201);
}

export async function register(req: Request, res: Response) {
  const input = registerClienteSchema.parse(req.body);
  responderSesion(res, await authService.registrarCliente(input), 201);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  responderSesion(res, await authService.iniciarSesion(input));
}

export async function refresh(req: Request, res: Response) {
  try {
    responderSesion(res, await authService.renovarSesion(leerCookie(req)));
  } catch (error) {
    // Si la renovación falla, la cookie ya no sirve: se borra
    res.clearCookie(REFRESH_COOKIE, { ...opcionesCookieRefresh(), maxAge: undefined });
    throw error;
  }
}

export async function logout(req: Request, res: Response) {
  await authService.cerrarSesion(leerCookie(req));
  res.clearCookie(REFRESH_COOKIE, { ...opcionesCookieRefresh(), maxAge: undefined });
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const { usuarioId, tallerId } = usuarioActual(req);
  res.json({ data: await authService.obtenerPerfil(usuarioId, tallerId) });
}
