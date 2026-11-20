import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import {
  authApi,
  type CambiarPasswordBody,
  type LoginBody,
  type PerfilBody,
  type RegistroClienteBody,
  type RegistroInvitacionBody,
  type RegistroTallerBody,
  type SesionResponse,
} from '../api/auth-api';
import { cerrarSesion } from '../session-bootstrap';
import { useSession } from '../store/session';

const guardarSesion = ({ accessToken, usuario }: SesionResponse) =>
  useSession.getState().setSession(accessToken, usuario);

/** HU-19 · POST /auth/login */
export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginBody) => authApi.login(body),
    onSuccess: guardarSesion,
  });
}

/** HU-20 · POST /auth/register-taller */
export function useRegistroTaller() {
  return useMutation({
    mutationFn: (body: RegistroTallerBody) => authApi.registrarTaller(body),
    onSuccess: guardarSesion,
  });
}

/** HU-20 · POST /auth/register */
export function useRegistroCliente() {
  return useMutation({
    mutationFn: (body: RegistroClienteBody) => authApi.registrarCliente(body),
    onSuccess: guardarSesion,
  });
}

/** HU-67 · GET /invitaciones/codigo/:codigo */
export function useValidarInvitacion() {
  return useMutation({ mutationFn: (codigo: string) => authApi.validarInvitacion(codigo) });
}

/** HU-67 · POST /auth/register-invitacion */
export function useRegistroInvitacion() {
  return useMutation({
    mutationFn: (body: RegistroInvitacionBody) => authApi.registrarConInvitacion(body),
    onSuccess: guardarSesion,
  });
}

/** HU-22 · POST /auth/logout */
export function useLogout() {
  return useMutation({ mutationFn: cerrarSesion });
}

/** HU-22, HU-83 · Botón "Cerrar sesión": avisa al backend, limpia la sesión y vuelve al ingreso del rol. */
export function useSalir() {
  const logout = useLogout();
  const navigate = useNavigate();
  return {
    salir: async () => {
      const eraCliente = useSession.getState().usuario?.rol === 'cliente';
      await logout.mutateAsync();
      navigate(eraCliente ? '/login?tab=cliente' : '/login', { replace: true });
      toast('Cerraste sesión');
    },
    saliendo: logout.isPending,
  };
}

/** HU-86 · Guarda mis datos y los refleja de inmediato en la sesión activa */
export function useActualizarPerfil() {
  return useMutation({
    mutationFn: (body: PerfilBody) => authApi.actualizarPerfil(body),
    onSuccess: (usuario) => {
      const { accessToken } = useSession.getState();
      if (accessToken) useSession.getState().setSession(accessToken, usuario);
    },
  });
}

/** HU-86 · Cambia la contraseña y sigue con la sesión nueva que entrega el backend */
export function useCambiarPassword() {
  return useMutation({
    mutationFn: (body: CambiarPasswordBody) => authApi.cambiarPassword(body),
    onSuccess: guardarSesion,
  });
}

/** Lista de talleres para que el cliente elija el suyo al registrarse. */
export function useTalleresPublicos() {
  return useQuery({
    queryKey: ['talleres', 'publicos'],
    queryFn: authApi.talleresPublicos,
    staleTime: 5 * 60_000,
  });
}

const CLAVE_MIS_TALLERES = ['auth', 'talleres'] as const;

/** HU-91 · Talleres de la cuenta del cliente (el activo marcado) */
export function useMisTalleres(activo = true) {
  return useQuery({ queryKey: CLAVE_MIS_TALLERES, queryFn: authApi.misTalleres, enabled: activo });
}

/** HU-91 · Agregar otro taller a la cuenta */
export function useVincularTaller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tallerPublicId: string) => authApi.vincularTaller(tallerPublicId),
    onSuccess: (talleres) => qc.setQueryData(CLAVE_MIS_TALLERES, talleres),
  });
}

/**
 * HU-91 · Cambia el taller activo: sesión nueva y se vuelven a pedir los datos (motos, órdenes,
 * avisos) del otro taller.
 */
export function useCambiarTaller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tallerPublicId: string) => authApi.cambiarTaller(tallerPublicId),
    onSuccess: async (sesion) => {
      guardarSesion(sesion);
      await qc.resetQueries();
    },
  });
}
