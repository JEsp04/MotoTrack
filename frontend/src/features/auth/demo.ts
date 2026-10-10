import type { Rol, Usuario } from '@/types';
import { useSession } from './store/session';

/**
 * SOLO PARA DESARROLLO mientras se construye el ingreso real (HU-19).
 * Permite ver los layouts y la navegación de cada rol sin backend.
 * Borrar cuando HU-19 y HU-21 estén listas.
 */
const DEMO: Record<Rol, Usuario> = {
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

export function entrarComoDemo(rol: Rol) {
  useSession.getState().setSession('token-de-demostracion', DEMO[rol]);
}
