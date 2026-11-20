import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import type { Usuario } from '@/types';
import { useActualizarPerfil, useCambiarPassword } from '../hooks/use-auth';
import {
  cambiarPasswordSchema,
  LIMITES,
  perfilSchema,
  type CambiarPasswordValores,
  type PerfilValores,
} from '../schemas/auth-schemas';

/** HU-86 · Hoja «Editar mis datos»: nombre, correo y celular del usuario con sesión */
export function EditarPerfilSheet({
  open,
  usuario,
  onClose,
}: {
  open: boolean;
  usuario: Usuario;
  onClose: () => void;
}) {
  const guardar = useActualizarPerfil();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const esCliente = usuario.rol === 'cliente';
  const inicial: PerfilValores = {
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono ?? '',
  };
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<PerfilValores>({
    resolver: zodResolver(perfilSchema(esCliente)),
    mode: 'onTouched',
    values: inicial,
  });

  function cerrar() {
    reset(inicial);
    setErrorGeneral(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      await guardar.mutateAsync({
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono.replace(/[\s-]/g, ''),
      });
      toast('Guardamos tus datos', 'success');
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open={open}
      title="Editar mis datos"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-perfil" loading={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-perfil" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Nombre completo"
          required
          autoComplete="name"
          maxLength={LIMITES.nombre}
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Correo"
          type="email"
          required
          autoComplete="email"
          maxLength={LIMITES.email}
          hint="Es con el que ingresas a MotoTrack."
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Celular"
          type="tel"
          inputMode="numeric"
          required={esCliente}
          autoComplete="tel"
          maxLength={LIMITES.telefono}
          hint={esCliente ? 'El taller lo usa para avisarte por WhatsApp.' : undefined}
          error={errors.telefono?.message}
          {...register('telefono')}
        />
      </form>
    </BottomSheet>
  );
}

const VACIO: CambiarPasswordValores = { passwordActual: '', password: '', confirmar: '' };

/**
 * HU-86 · Hoja «Cambiar contraseña»: pide la actual y la nueva dos veces. Al guardar, las
 * demás sesiones se cierran y esta sigue abierta.
 */
export function CambiarPasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cambiar = useCambiarPassword();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CambiarPasswordValores>({
    resolver: zodResolver(cambiarPasswordSchema),
    mode: 'onTouched',
    defaultValues: VACIO,
  });

  function cerrar() {
    reset(VACIO);
    setErrorGeneral(null);
    onClose();
  }

  const onSubmit = handleSubmit(async ({ passwordActual, password }) => {
    setErrorGeneral(null);
    try {
      await cambiar.mutateAsync({ passwordActual, passwordNueva: password });
      toast('Cambiaste tu contraseña. Cerramos tus otras sesiones.', 'success');
      cerrar();
    } catch (error) {
      const e = parseApiError(error);
      // El backend llama «passwordNueva» al campo que aquí es «password»
      const campos = aplicarErroresDeCampo(setError, e, { passwordNueva: 'password' });
      if (campos.length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open={open}
      title="Cambiar contraseña"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-clave" loading={cambiar.isPending}>
            Cambiar
          </Button>
        </>
      }
    >
      <form id="form-clave" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Contraseña actual"
          type="password"
          required
          autoComplete="current-password"
          maxLength={LIMITES.password}
          error={errors.passwordActual?.message}
          {...register('passwordActual')}
        />
        <Input
          label="Contraseña nueva"
          type="password"
          required
          autoComplete="new-password"
          maxLength={LIMITES.password}
          hint="Mínimo 8 caracteres, con al menos una letra y un número."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Repite la contraseña nueva"
          type="password"
          required
          autoComplete="new-password"
          maxLength={LIMITES.password}
          error={errors.confirmar?.message}
          {...register('confirmar')}
        />
        <p className="text-sm leading-5 text-ink-muted">
          Al cambiarla, cerramos tu sesión en los demás dispositivos.
        </p>
      </form>
    </BottomSheet>
  );
}
