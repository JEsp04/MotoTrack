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
const inventario = page(() => import('@/pages/InventarioPage'));
const asistente = page(() => import('@/pages/AsistentePage'));

/** Pantallas sin barra inferior en celular (como en el prototipo): tienen su propia barra de acciones */
const SIN_NAV = { sinNav: true };

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      // HU-90 · Seguimiento público por enlace: abre con o sin sesión
      { path: '/s/:id', element: page(() => import('@/pages/SeguimientoPublicoPage')) },
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
              // HU-67 · Unirse al taller con una invitación
              {
                path: '/unirse',
                element: page(() => import('@/pages/auth/UnirsePage')),
                handle: { panel: 'Tengo una invitación' },
              },
              {
                path: '/i/:codigo',
                element: page(() => import('@/pages/auth/UnirsePage')),
                handle: { panel: 'Tengo una invitación' },
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
          // HU-54 / HU-55 · Inventario
          { path: 'inventario', element: inventario },
          {
            path: 'inventario/nuevo',
            element: page(() => import('@/pages/admin/NuevoRepuestoPage')),
            handle: SIN_NAV,
          },
          // HU-87 · Editar o desactivar un repuesto
          {
            path: 'inventario/:id/editar',
            element: page(() => import('@/pages/admin/EditarRepuestoPage')),
            handle: SIN_NAV,
          },
          { path: 'equipo', element: page(() => import('@/pages/admin/EquipoPage')) },
          // HU-67 · Invitar usuario
          {
            path: 'equipo/invitar',
            element: page(() => import('@/pages/admin/InvitarUsuarioPage')),
            handle: SIN_NAV,
          },
          { path: 'perfil', element: perfil },
          // HU-73 · «Más» del admin y los datos del taller
          { path: 'mas', element: perfil },
          {
            path: 'taller',
            element: page(() => import('@/pages/admin/DatosTallerPage')),
            handle: SIN_NAV,
          },
          // HU-89 · Reseñas de los clientes
          { path: 'resenas', element: page(() => import('@/pages/admin/ResenasPage')) },
          // HU-80 · Plan del taller y facturas
          { path: 'suscripcion', element: page(() => import('@/pages/admin/SuscripcionPage')) },
          {
            path: 'suscripcion/pago',
            element: page(() => import('@/pages/admin/PagoSuscripcionPage')),
          },
          // HU-58 · Agenda de citas
          { path: 'citas', element: page(() => import('@/pages/admin/CitasPage')) },
          // HU-61 · Ficha de la moto
          { path: 'motos/:id', element: page(() => import('@/pages/admin/MotoPage')) },
        ],
      },

      {
        path: '/mecanico',
        element: <RoleLayout rol="mecanico" />,
        children: [
          { index: true, element: page(() => import('@/pages/mecanico/InicioPage')) },
          { path: 'ordenes', element: page(() => import('@/pages/mecanico/OrdenesPage')) },
          { path: 'ordenes/:id', element: ordenDetalle, handle: SIN_NAV },
          { path: 'inventario', element: inventario },
          { path: 'asistente', element: asistente },
          { path: 'perfil', element: perfil },
          // HU-86 · «Más» del mecánico en celular; «Mi cuenta» queda en /mecanico/perfil
          { path: 'mas', element: perfil },
          // HU-58 · Agenda de citas en solo lectura
          { path: 'citas', element: page(() => import('@/pages/mecanico/CitasPage')) },
        ],
      },

      {
        path: '/cliente',
        element: <RoleLayout rol="cliente" />,
        children: [
          { index: true, element: page(() => import('@/pages/cliente/MotosPage')) },
          { path: 'ordenes', element: page(() => import('@/pages/cliente/OrdenesPage')) },
          { path: 'ordenes/:id', element: ordenDetalle, handle: SIN_NAV },
          { path: 'asistente', element: asistente },
          { path: 'perfil', element: perfil },
          // HU-59 · Pedir una cita y su confirmación
          { path: 'citas', element: page(() => import('@/pages/cliente/MisCitasPage')) },
          {
            path: 'citas/nueva',
            element: page(() => import('@/pages/cliente/PedirCitaPage')),
            handle: SIN_NAV,
          },
          {
            path: 'citas/:id/agendada',
            element: page(() => import('@/pages/cliente/CitaAgendadaPage')),
            handle: SIN_NAV,
          },
          // HU-61 · Ficha de la moto
          { path: 'motos/:id', element: page(() => import('@/pages/cliente/MotoPage')) },
          // HU-60 · Reprogramar una cita
          {
            path: 'citas/:id/reprogramar',
            element: page(() => import('@/pages/cliente/ReprogramarCitaPage')),
            handle: SIN_NAV,
          },
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
