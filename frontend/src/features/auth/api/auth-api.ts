import { http } from '@/lib/http';
import type { ApiResponse, Usuario } from '@/types';

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

  talleresPublicos: () =>
    http.get<ApiResponse<TallerPublico[]>>('/talleres/publicos').then((r) => r.data.data),
};
