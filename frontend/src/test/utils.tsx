import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { useSession } from '@/features/auth';
import { routes } from '@/router';
import type { Rol, Usuario } from '@/types';

export const USUARIOS_PRUEBA: Record<Rol, Usuario> = {
  admin: {
    usuarioId: 1,
    tallerId: 1,
    nombre: 'Carolina Restrepo',
    email: 'admin@mototrack.co',
    rol: 'admin',
  },
  mecanico: {
    usuarioId: 2,
    tallerId: 1,
    nombre: 'Andrés Gómez',
    email: 'andres@mototrack.co',
    rol: 'mecanico',
  },
  cliente: {
    usuarioId: 4,
    tallerId: 1,
    nombre: 'Laura Martínez',
    email: 'laura@correo.co',
    rol: 'cliente',
  },
};

/** Deja una sesión iniciada con el rol indicado (solo para pruebas). */
export function sesionDePrueba(rol: Rol) {
  useSession.getState().setSession(`token-${rol}`, USUARIOS_PRUEBA[rol]);
}

/** Abre la app completa en una ruta, con React Query y el router en memoria. */
export function abrirApp(ruta: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [ruta] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
