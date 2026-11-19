import { create } from 'zustand';
import type { Rol, Usuario } from '@/types';

/**
 * Sesión del usuario (contexto.md, sección 7).
 * El token de acceso vive SOLO en memoria: nunca en localStorage ni sessionStorage.
 * Al abrir la app se recupera con POST /auth/refresh (HU-21, ver session-bootstrap.ts).
 *
 * `SESION_PREVIA_KEY` guarda únicamente `'1'` (bandera booleana no sensible, sin tokens ni datos)
 * para no disparar `POST /auth/refresh` (401) a visitantes anónimos en rutas públicas (HU-83).
 *
 * - checking: la app acaba de abrir y está preguntando al backend si hay sesión.
 * - authenticated: hay usuario y token.
 * - anonymous: no hay sesión.
 */
export type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

const SESION_PREVIA_KEY = 'mototrack_sesion';

export function tieneSesionPrevia(): boolean {
  try {
    return window.localStorage.getItem(SESION_PREVIA_KEY) === '1';
  } catch {
    return false;
  }
}

export function marcarSesionPrevia(activa: boolean): void {
  try {
    if (activa) window.localStorage.setItem(SESION_PREVIA_KEY, '1');
    else window.localStorage.removeItem(SESION_PREVIA_KEY);
  } catch {
    // Modo privado o almacenamiento bloqueado: degradar sin romper
  }
}

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  usuario: Usuario | null;
  setSession: (accessToken: string, usuario: Usuario) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: 'checking',
  accessToken: null,
  usuario: null,
  setSession: (accessToken, usuario) => {
    marcarSesionPrevia(true);
    set({ status: 'authenticated', accessToken, usuario });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => {
    marcarSesionPrevia(false);
    set({ status: 'anonymous', accessToken: null, usuario: null });
  },
}));

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  mecanico: 'Mecánico',
  cliente: 'Cliente',
};

/** Ruta de inicio de cada rol */
export const HOME_POR_ROL: Record<Rol, string> = {
  admin: '/admin',
  mecanico: '/mecanico',
  cliente: '/cliente',
};

/** A dónde ir después de ingresar: la ruta pedida si es del rol, si no su inicio. */
export function destinoTrasIngreso(rol: Rol, desde?: string | null): string {
  const home = HOME_POR_ROL[rol];
  return desde && (desde === home || desde.startsWith(`${home}/`)) ? desde : home;
}
