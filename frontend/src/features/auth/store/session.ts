import { create } from 'zustand';
import type { Rol, Usuario } from '@/types';

/**
 * Sesión del usuario (docs/CONTEXTO.md, sección 6).
 * El token de acceso vive SOLO en memoria: nunca en localStorage ni sessionStorage.
 * Al recargar la página se recupera con POST /auth/refresh (HU-21).
 */
export type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

interface SessionState {
  status: SessionStatus;
  accessToken: string | null;
  usuario: Usuario | null;
  setSession: (accessToken: string, usuario: Usuario) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  // Mientras no exista HU-21, la app arranca sin sesión
  status: 'anonymous',
  accessToken: null,
  usuario: null,
  setSession: (accessToken, usuario) => set({ status: 'authenticated', accessToken, usuario }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ status: 'anonymous', accessToken: null, usuario: null }),
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
