import { createHmac, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env, isProduction } from '../../config/env.js';
import type { Rol } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';

/** Datos que viajan dentro del token de acceso (docs/CONTEXTO.md, sección 6) */
export interface AccessPayload {
  usuarioId: number;
  rol: Rol;
  tallerId: number;
}

export const REFRESH_COOKIE = 'refreshToken';

/** "15m", "7d", "12h", "30s" → milisegundos */
export function duracionEnMs(valor: string): number {
  const m = /^(\d+)\s*([smhd])$/.exec(valor.trim());
  if (!m) throw new Error(`Duración inválida: "${valor}". Usa por ejemplo 15m, 12h o 7d.`);
  const n = Number(m[1]);
  const unidad = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    m[2] as 's' | 'm' | 'h' | 'd'
  ];
  return n * unidad;
}

// ─── Token de acceso (JWT, 15 minutos, viaja en Authorization: Bearer) ──────

export function firmarAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
  });
}

export function verificarAccessToken(token: string): AccessPayload {
  try {
    const data = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    if (typeof data === 'string' || !data.usuarioId || !data.rol || !data.tallerId) {
      throw new Error('Token sin los datos esperados');
    }
    return { usuarioId: data.usuarioId, rol: data.rol, tallerId: data.tallerId };
  } catch {
    throw HttpError.unauthorized('Tu sesión expiró. Ingresa de nuevo.');
  }
}

// ─── Token de renovación (aleatorio, 7 días, cookie httpOnly) ───────────────

/** Token opaco y aleatorio. Al cliente va el token; en la base solo su hash. */
export function generarRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** HMAC-SHA256 con JWT_REFRESH_SECRET: si se filtra la base, los hashes no sirven solos. */
export function hashRefreshToken(token: string): string {
  return createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}

export function refreshExpiraEn(desde = new Date()): Date {
  return new Date(desde.getTime() + duracionEnMs(env.JWT_REFRESH_EXPIRES));
}

export function opcionesCookieRefresh(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: duracionEnMs(env.JWT_REFRESH_EXPIRES),
  };
}
