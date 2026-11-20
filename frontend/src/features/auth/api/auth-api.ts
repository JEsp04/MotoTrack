import { http } from '@/lib/http';
import type { ApiResponse, InvitacionValidada, TallerCliente, Usuario } from '@/types';

/** Respuesta de login, registro y renovación: token de acceso + usuario. */
export interface SesionResponse {
  accessToken: string;
  usuario: Usuario;
}

export interface TallerPublico {
  publicId: string;
  nombre: string;
  direccion: string | null;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegistroTallerBody {
  taller: { nombre: string; nit?: string; telefono: string; direccion?: string };
  admin: { nombre: string; email: string; password: string; telefono?: string };
}

export interface RegistroClienteBody {
  /** publicId del taller elegido */
  tallerPublicId: string;
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
  password: string;
}

/** HU-67 · Crear la cuenta con una invitación. El rol y el taller salen de la invitación. */
export interface RegistroInvitacionBody {
  codigo: string;
  nombre: string;
  email: string;
  password: string;
  aceptaTerminos: true;
}

/** HU-86 · Campo ausente = no cambia; teléfono '' lo borra (solo personal del taller) */
export interface PerfilBody {
  nombre?: string;
  email?: string;
  telefono?: string;
}

export interface CambiarPasswordBody {
  passwordActual: string;
  passwordNueva: string;
}

/** Llamadas a /api/auth (docs/HISTORIAS.md, HU-13 a HU-18). */
export const authApi = {
  login: (body: LoginBody) =>
    http.post<ApiResponse<SesionResponse>>('/auth/login', body).then((r) => r.data.data),

  registrarTaller: (body: RegistroTallerBody) =>
    http.post<ApiResponse<SesionResponse>>('/auth/register-taller', body).then((r) => r.data.data),

  registrarCliente: (body: RegistroClienteBody) =>
    http.post<ApiResponse<SesionResponse>>('/auth/register', body).then((r) => r.data.data),

  /** Usa la cookie httpOnly; no lleva cuerpo. */
  refresh: () => http.post<ApiResponse<SesionResponse>>('/auth/refresh').then((r) => r.data.data),

  logout: () => http.post('/auth/logout').then(() => undefined),

  registrarConInvitacion: (body: RegistroInvitacionBody) =>
    http
      .post<ApiResponse<SesionResponse>>('/auth/register-invitacion', body)
      .then((r) => r.data.data),

  /** HU-67 · Validación pública del código (sin sesión) */
  validarInvitacion: (codigo: string) =>
    http
      .get<ApiResponse<InvitacionValidada>>(`/invitaciones/codigo/${encodeURIComponent(codigo)}`)
      .then((r) => r.data.data),

  /** HU-86 · Editar mis datos */
  actualizarPerfil: (body: PerfilBody) =>
    http.patch<ApiResponse<Usuario>>('/auth/perfil', body).then((r) => r.data.data),

  /** HU-86 · Cambiar mi contraseña: devuelve una sesión nueva (las demás se cierran) */
  cambiarPassword: (body: CambiarPasswordBody) =>
    http.patch<ApiResponse<SesionResponse>>('/auth/password', body).then((r) => r.data.data),

  /** HU-91 · Talleres de mi cuenta de cliente */
  misTalleres: () =>
    http.get<ApiResponse<TallerCliente[]>>('/auth/talleres').then((r) => r.data.data),

  /** HU-91 · Agrega otro taller a mi cuenta (vincula la ficha que ya tenía allá o crea una) */
  vincularTaller: (tallerPublicId: string) =>
    http
      .post<ApiResponse<TallerCliente[]>>('/auth/talleres', { tallerPublicId })
      .then((r) => r.data.data),

  /** HU-91 · Pasa a ver otro de mis talleres: devuelve una sesión nueva de ese taller */
  cambiarTaller: (tallerPublicId: string) =>
    http
      .post<ApiResponse<SesionResponse>>('/auth/taller-activo', { tallerPublicId })
      .then((r) => r.data.data),

  talleresPublicos: () =>
    http.get<ApiResponse<TallerPublico[]>>('/talleres/publicos').then((r) => r.data.data),
};
