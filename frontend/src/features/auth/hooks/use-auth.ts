import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import {
  authApi,
  type LoginBody,
  type RegistroClienteBody,
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

/** HU-22 · POST /auth/logout */
export function useLogout() {
  return useMutation({ mutationFn: cerrarSesion });
}

/** HU-22 · Botón "Cerrar sesión": avisa al backend, limpia la sesión y va al ingreso. */
export function useSalir() {
  const logout = useLogout();
  const navigate = useNavigate();
  return {
    salir: async () => {
      await logout.mutateAsync();
      navigate('/login', { replace: true });
      toast('Cerraste sesión');
    },
    saliendo: logout.isPending,
  };
}

/** Lista de talleres para que el cliente elija el suyo al registrarse. */
export function useTalleresPublicos() {
  return useQuery({
    queryKey: ['talleres', 'publicos'],
    queryFn: authApi.talleresPublicos,
    staleTime: 5 * 60_000,
  });
}
