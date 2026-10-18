import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import RouteErrorPage from '@/pages/RouteErrorPage';
import { FullPageLoader, GuestOnly } from './guards';
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
const ordenDetalle = page(() => import('@/pages/OrdenDetallePage'));

/** Pantallas sin barra inferior en celular (como en el prototipo): tienen su propia barra de acciones */
const SIN_NAV = { sinNav: true };

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      // Landing con el panel de ingreso o registro encima (HU-45)
      {
        element: <GuestOnly />,
        children: [
          {
            element: page(() => import('@/pages/landing/LandingLayout')),
            children: [
              { path: '/', element: null },
              {
                path: '/login',
                element: page(() => import('@/pages/auth/LoginPage')),
                handle: { panel: 'Iniciar sesión' },
              },
              {
                path: '/registro',
                element: page(() => import('@/pages/auth/RegistroPage')),
                handle: { panel: 'Crear cuenta' },
              },
              {
                path: '/registro/taller',
                element: page(() => import('@/pages/auth/RegistroTallerPage')),
                handle: { panel: 'Registrar taller' },
              },
              {
                path: '/registro/cliente',
                element: page(() => import('@/pages/auth/RegistroClientePage')),
                handle: { panel: 'Cuenta de cliente' },
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
          {
            path: 'ordenes/nueva',
            element: page(() => import('@/pages/admin/NuevaOrdenPage')),
            handle: SIN_NAV,
          },
          { path: 'ordenes/:id', element: ordenDetalle, handle: SIN_NAV },
          { path: 'clientes', element: page(() => import('@/pages/admin/ClientesPage')) },
          {
            path: 'clientes/:id',
            element: page(() => import('@/pages/admin/ClienteDetallePage')),
          },
          { path: 'equipo', element: page(() => import('@/pages/admin/EquipoPage')) },
          { path: 'perfil', element: perfil },
        ],
      },

      {
        path: '/mecanico',
        element: <RoleLayout rol="mecanico" />,
        children: [
          { index: true, element: page(() => import('@/pages/mecanico/OrdenesPage')) },
          { path: 'ordenes/:id', element: ordenDetalle, handle: SIN_NAV },
          { path: 'perfil', element: perfil },
        ],
      },

      {
        path: '/cliente',
        element: <RoleLayout rol="cliente" />,
        children: [
          { index: true, element: page(() => import('@/pages/cliente/MotosPage')) },
          { path: 'ordenes', element: page(() => import('@/pages/cliente/OrdenesPage')) },
          { path: 'ordenes/:id', element: ordenDetalle, handle: SIN_NAV },
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
