import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AuthLayout } from '@/components/layout';
import RouteErrorPage from '@/pages/RouteErrorPage';
import { FullPageLoader, GuestOnly, HomeRedirect } from './guards';
import { RoleLayout } from './RoleLayout';

/** Cada página se carga en su propio archivo, solo cuando se visita (HU-11). */
function page(loader: () => Promise<{ default: ComponentType }>) {
  const Component: LazyExoticComponent<ComponentType> = lazy(loader);
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Component />
    </Suspense>
  );
}

const perfil = page(() => import('@/pages/PerfilPage'));

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <HomeRedirect /> },

      {
        element: <AuthLayout />,
        children: [
          {
            element: <GuestOnly />,
            children: [
              { path: '/login', element: page(() => import('@/pages/auth/LoginPage')) },
              { path: '/registro', element: page(() => import('@/pages/auth/RegistroPage')) },
              {
                path: '/registro/taller',
                element: page(() => import('@/pages/auth/RegistroTallerPage')),
              },
              {
                path: '/registro/cliente',
                element: page(() => import('@/pages/auth/RegistroClientePage')),
              },
            ],
          },
        ],
      },

      {
        path: '/admin',
        element: <RoleLayout rol="admin" />,
        children: [
          { index: true, element: page(() => import('@/pages/admin/InicioPage')) },
          { path: 'ordenes', element: page(() => import('@/pages/admin/OrdenesPage')) },
          { path: 'clientes', element: page(() => import('@/pages/admin/ClientesPage')) },
          { path: 'equipo', element: page(() => import('@/pages/admin/EquipoPage')) },
          { path: 'perfil', element: perfil },
        ],
      },

      {
        path: '/mecanico',
        element: <RoleLayout rol="mecanico" />,
        children: [
          { index: true, element: page(() => import('@/pages/mecanico/OrdenesPage')) },
          { path: 'perfil', element: perfil },
        ],
      },

      {
        path: '/cliente',
        element: <RoleLayout rol="cliente" />,
        children: [
          { index: true, element: page(() => import('@/pages/cliente/MotosPage')) },
          { path: 'ordenes', element: page(() => import('@/pages/cliente/OrdenesPage')) },
          { path: 'perfil', element: perfil },
        ],
      },

      // Catálogo de componentes para el equipo (solo en desarrollo)
      ...(import.meta.env.DEV
        ? [{ path: '/dev/ui', element: page(() => import('@/pages/dev/UiShowcasePage')) }]
        : []),

      { path: '*', element: page(() => import('@/pages/NotFoundPage')) },
    ],
  },
];

export const router = createBrowserRouter(routes);
