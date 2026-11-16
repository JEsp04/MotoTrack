import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth';
import { tallerApi, type ActualizarTallerBody } from '../api/taller-api';

const CLAVE = ['taller', 'mio'] as const;

export function useMiTaller() {
  return useQuery({ queryKey: CLAVE, queryFn: tallerApi.obtener });
}

export function useActualizarTaller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ActualizarTallerBody) => tallerApi.actualizar(body),
    onSuccess: (taller) => {
      qc.setQueryData(CLAVE, taller);
      // El nombre del taller también se ve en la barra superior y en «Más»
      useSession.setState((s) =>
        s.usuario
          ? { usuario: { ...s.usuario, taller: { ...s.usuario.taller, nombre: taller.nombre } } }
          : s,
      );
    },
  });
}
