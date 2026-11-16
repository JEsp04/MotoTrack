import { configureHttpAuth, refreshOnce } from '@/lib/http';
import { queryClient } from '@/lib/query-client';
import { toast } from '@/lib/toast';
import { authApi } from './api/auth-api';
import { useSession } from './store/session';

let configurado = false;

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
 * Al abrir o recargar la app: si la cookie de renovación sigue viva, recupera
 * la sesión sin pedir la contraseña. Si no, queda como anónima.
 */
export async function recuperarSesion(): Promise<void> {
  configurarSesionHttp();
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
