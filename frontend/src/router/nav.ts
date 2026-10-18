import type { NavItem } from '@/components/layout';
import type { Rol } from '@/types';

/** Opciones del menú por rol (HU-10). El mecánico nunca ve "Clientes". */
export const NAV_POR_ROL: Record<Rol, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Inicio', icon: 'home', end: true },
    { to: '/admin/ordenes', label: 'Órdenes', icon: 'clipboard' },
    { to: '/admin/clientes', label: 'Clientes', icon: 'users' },
    { to: '/admin/equipo', label: 'Equipo', icon: 'team' },
    { to: '/admin/perfil', label: 'Perfil', icon: 'user', enMenuCuenta: true },
  ],
  mecanico: [
    { to: '/mecanico', label: 'Mis órdenes', icon: 'wrench', end: true },
    { to: '/mecanico/perfil', label: 'Perfil', icon: 'user', enMenuCuenta: true },
  ],
  cliente: [
    { to: '/cliente', label: 'Mis motos', icon: 'moto', end: true },
    { to: '/cliente/ordenes', label: 'Mis órdenes', icon: 'clipboard' },
    { to: '/cliente/perfil', label: 'Perfil', icon: 'user', enMenuCuenta: true },
  ],
};

/** Botón principal de la barra superior en computador */
export const ACCION_PRINCIPAL: Partial<Record<Rol, { to: string; label: string }>> = {
  admin: { to: '/admin/ordenes/nueva', label: 'Recibir moto' },
};
