import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

/** Errores que no vale la pena reintentar: la respuesta no va a cambiar */
function debeReintentar(fallos: number, error: unknown) {
  if (isAxiosError(error) && error.response) {
    const s = error.response.status;
    if (s >= 400 && s < 500) return false;
  }
  return fallos < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: debeReintentar,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
