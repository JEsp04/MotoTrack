import type { NavItem } from '@/components/layout';
import type { IconName } from '@/components/ui';
import type { Rol } from '@/types';

/**
 * Opciones del menú por rol (HU-10, HU-44), con los nombres del prototipo.
 * En celular, Clientes y Usuarios están dentro de «Más». El mecánico nunca ve "Clientes".
 */
export const NAV_POR_ROL: Record<Rol, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Inicio', labelEscritorio: 'Taller', icon: 'home', end: true },
    { to: '/admin/ordenes', label: 'Órdenes', icon: 'clipboard' },
    { to: '/admin/clientes', label: 'Clientes y motos', icon: 'users', donde: 'escritorio' },
    { to: '/admin/equipo', label: 'Usuarios', icon: 'user', donde: 'escritorio' },
    { to: '/admin/perfil', label: 'Más', icon: 'menu', donde: 'celular' },
  ],
  mecanico: [
    {
      to: '/mecanico',
      label: 'Órdenes',
      labelEscritorio: 'Mis órdenes',
      icon: 'clipboard',
      end: true,
    },
    { to: '/mecanico/perfil', label: 'Más', icon: 'menu', donde: 'celular' },
  ],
  cliente: [
    { to: '/cliente', label: 'Inicio', icon: 'home', end: true },
    { to: '/cliente/ordenes', label: 'Órdenes', icon: 'clipboard' },
    { to: '/cliente/perfil', label: 'Cuenta', icon: 'user' },
  ],
};

/** Botón principal de la barra superior en computador */
export const ACCION_PRINCIPAL: Partial<Record<Rol, { to: string; label: string }>> = {
  admin: { to: '/admin/ordenes/nueva', label: 'Recibir moto' },
};

/** Enlaces del menú del avatar en computador */
export const ENLACES_CUENTA: Record<Rol, Array<{ to: string; label: string; icon: IconName }>> = {
  admin: [{ to: '/admin/perfil', label: 'Mi cuenta', icon: 'user' }],
  mecanico: [{ to: '/mecanico/perfil', label: 'Mi cuenta', icon: 'user' }],
  cliente: [],
};
