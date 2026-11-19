import type { RolInvitado } from '@/types';

export const ROL_INVITADO: Record<RolInvitado, string> = {
  mecanico: 'Mecánico',
  admin: 'Administrador',
};

/** Enlace que abre «Únete a tu taller» con el código ya escrito */
export const enlaceInvitacion = (codigo: string) => `${window.location.origin}/i/${codigo}`;

/** Mensaje de la invitación, como en el prototipo (InviteScreen) */
export function mensajeInvitacion(d: {
  nombre: string;
  admin: string;
  taller: string;
  rol: RolInvitado;
  codigo: string;
}) {
  const primerNombre = d.nombre.trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola ${primerNombre}, ` : 'Hola, ';
  return (
    `${saludo}${d.admin} te invitó a ${d.taller} en MotoTrack como ` +
    `${ROL_INVITADO[d.rol].toLowerCase()}.\n\n` +
    `Crea tu cuenta aquí: ${enlaceInvitacion(d.codigo)}\n` +
    `Código de invitación: ${d.codigo}\n` +
    'Vence en 7 días.'
  );
}
