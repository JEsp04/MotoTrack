import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Cliente HTTP de la app (HU-12).
 * - baseURL = VITE_API_URL y withCredentials para enviar la cookie de renovación.
 * - Agrega el token de acceso (que vive en memoria) como "Authorization: Bearer".
 * - Ante un 401 pide un token nuevo UNA sola vez (aunque fallen varias peticiones a la vez)
 *   y repite la petición. Si la renovación falla, avisa para cerrar la sesión (HU-21).
 *
 * lib no conoce features: la sesión se conecta desde features/auth con configureHttpAuth().
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

interface AuthHandlers {
  getAccessToken: () => string | null;
  /** Pide un token nuevo al backend y lo guarda. Devuelve null si no se pudo. */
  refresh: () => Promise<string | null>;
  onSessionExpired: () => void;
}

let handlers: AuthHandlers | null = null;
let refreshEnCurso: Promise<string | null> | null = null;

export function configureHttpAuth(h: AuthHandlers) {
  handlers = h;
}

/** Junta varias renovaciones simultáneas en una sola llamada. */
export function refreshOnce(): Promise<string | null> {
  if (!handlers) return Promise.resolve(null);
  refreshEnCurso ??= handlers.refresh().finally(() => {
    refreshEnCurso = null;
  });
  return refreshEnCurso;
}

/** Rutas de auth que nunca deben disparar una renovación automática */
const SIN_RENOVACION = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/register'];

http.interceptors.request.use((config) => {
  const token = handlers?.getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

type ConfigConReintento = InternalAxiosRequestConfig & { _reintento?: boolean };

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as ConfigConReintento | undefined;
    const url = original?.url ?? '';
    const esAuth = SIN_RENOVACION.some((ruta) => url.startsWith(ruta));

    if (error.response?.status === 401 && original && !original._reintento && !esAuth && handlers) {
      original._reintento = true;
      const nuevoToken = await refreshOnce();
      if (nuevoToken) {
        original.headers.set('Authorization', `Bearer ${nuevoToken}`);
        return http(original);
      }
      handlers.onSessionExpired();
    }
    return Promise.reject(error);
  },
);
