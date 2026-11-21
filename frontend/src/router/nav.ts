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
    { to: '/admin/inventario', label: 'Inventario', icon: 'box', donde: 'escritorio' },
    // HU-58 · Agenda de citas (pestaña «Citas» del prototipo, también en celular)
    { to: '/admin/citas', label: 'Citas', icon: 'calendar' },
    { to: '/admin/equipo', label: 'Usuarios', icon: 'user', donde: 'escritorio' },
    { to: '/admin/mas', label: 'Más', icon: 'menu', donde: 'celular' },
  ],
  mecanico: [
    { to: '/mecanico', label: 'Inicio', labelEscritorio: 'Mi día', icon: 'home', end: true },
    {
      to: '/mecanico/ordenes',
      label: 'Órdenes',
      labelEscritorio: 'Mis órdenes',
      icon: 'clipboard',
    },
    // HU-58 · Agenda en solo lectura (en celular está en «Más»)
    { to: '/mecanico/citas', label: 'Citas', icon: 'calendar', donde: 'escritorio' },
    { to: '/mecanico/inventario', label: 'Inventario', icon: 'box', donde: 'escritorio' },
    // HU-79 · Asistente IA de diagnóstico
    {
      to: '/mecanico/asistente',
      label: 'Asistente',
      labelEscritorio: 'Asistente IA',
      icon: 'sparkle',
    },
    { to: '/mecanico/mas', label: 'Más', icon: 'menu', donde: 'celular' },
  ],
  cliente: [
    { to: '/cliente', label: 'Inicio', icon: 'home', end: true },
    { to: '/cliente/ordenes', label: 'Órdenes', icon: 'clipboard' },
    // HU-60 · Mis citas (pestaña «Citas» del prototipo)
    { to: '/cliente/citas', label: 'Citas', icon: 'calendar' },
    // HU-79 · Asistente IA de diagnóstico (como en el prototipo)
    { to: '/cliente/asistente', label: 'Asistente', icon: 'sparkle' },
    { to: '/cliente/perfil', label: 'Cuenta', icon: 'user' },
  ],
};

/** Botón principal de la barra superior en computador */
export const ACCION_PRINCIPAL: Partial<Record<Rol, { to: string; label: string }>> = {
  admin: { to: '/admin/ordenes/nueva', label: 'Recibir moto' },
};

/** Enlaces del menú del avatar en computador */
export const ENLACES_CUENTA: Record<Rol, Array<{ to: string; label: string; icon: IconName }>> = {
  admin: [
    { to: '/admin/perfil', label: 'Mi cuenta', icon: 'user' },
    // HU-73 · En computador, los datos del taller están en el menú del avatar
    { to: '/admin/taller', label: 'Datos del taller', icon: 'settings' },
    // HU-89 · Reseñas de los clientes
    { to: '/admin/resenas', label: 'Reseñas', icon: 'star' },
    // HU-80 · Plan de MotoTrack y facturas
    { to: '/admin/suscripcion', label: 'Suscripción', icon: 'receipt' },
  ],
  mecanico: [{ to: '/mecanico/perfil', label: 'Mi cuenta', icon: 'user' }],
  cliente: [],
};
