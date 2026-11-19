import { configureHttpAuth, refreshOnce } from '@/lib/http';
import { queryClient } from '@/lib/query-client';
import { toast } from '@/lib/toast';
import { authApi } from './api/auth-api';
import { marcarSesionPrevia, tieneSesionPrevia, useSession } from './store/session';

let configurado = false;

function esRutaPublica(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/registro' ||
    pathname.startsWith('/registro/') ||
    pathname === '/unirse' ||
    pathname.startsWith('/i/')
  );
}

/**
 * Conecta la sesión con el cliente HTTP (HU-21):
 * - agrega el token en cada petición,
 * - ante un 401 renueva UNA vez con la cookie y repite la petición,
 * - si la renovación falla, cierra la sesión y avisa.
 */
export function configurarSesionHttp() {
  if (configurado) return;
  configurado = true;

  configureHttpAuth({
    getAccessToken: () => useSession.getState().accessToken,
    refresh: async () => {
      try {
        const { accessToken, usuario } = await authApi.refresh();
        useSession.getState().setSession(accessToken, usuario);
        return accessToken;
      } catch {
        marcarSesionPrevia(false);
        return null;
      }
    },
    onSessionExpired: () => {
      const estabaDentro = useSession.getState().status === 'authenticated';
      useSession.getState().clearSession();
      queryClient.clear();
      if (estabaDentro) toast('Tu sesión terminó. Ingresa de nuevo.', 'info');
    },
  });
}

/**
 * Al abrir o recargar la app: si hubo una sesión previa o se intenta abrir una ruta privada,
 * pregunta al backend si la cookie de renovación sigue viva. Si es una visita anónima a una ruta
 * pública, queda como anónima sin disparar un 401 innecesario (HU-83).
 */
export async function recuperarSesion(): Promise<void> {
  configurarSesionHttp();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (!tieneSesionPrevia() && esRutaPublica(pathname)) {
    useSession.getState().clearSession();
    return;
  }
  const token = await refreshOnce();
  if (!token) useSession.getState().clearSession();
}

/** HU-22: cierra la sesión en el backend (invalida la cookie) y limpia todo. */
export async function cerrarSesion(): Promise<void> {
  try {
    await authApi.logout();
  } catch {
    // Aunque falle la red, en este navegador la sesión se cierra igual
  }
  useSession.getState().clearSession();
  queryClient.clear();
}
