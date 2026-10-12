import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import {
  email,
  LIMITES,
  maximo,
  obligatorio,
  password,
  telefonoOpcional,
} from '@/lib/validaciones';
import { useCrearMecanico } from '../hooks/use-equipo';

const schema = z.object({
  nombre: obligatorio('El nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  email,
  telefono: telefonoOpcional,
  password,
});
type Valores = z.infer<typeof schema>;

const VACIO: Valores = { nombre: '', email: '', telefono: '', password: '' };

/** HU-23 · El admin crea la cuenta de un mecánico con una contraseña temporal. */
export function NuevoMecanicoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const crear = useCrearMecanico();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: VACIO });

  function cerrar() {
    reset(VACIO);
    setErrorGeneral(null);
    onClose();
  }

  const onSubmit = handleSubmit(async ({ telefono, ...datos }) => {
    setErrorGeneral(null);
    try {
      const mecanico = await crear.mutateAsync({ ...datos, telefono: telefono || undefined });
      toast(`Listo: ${mecanico.nombre} ya puede ingresar`, 'success');
      cerrar();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open={open}
      title="Agregar mecánico"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-mecanico" loading={crear.isPending}>
            Crear cuenta
          </Button>
        </>
      }
    >
      <form id="form-mecanico" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Nombre completo"
          required
          autoComplete="off"
          maxLength={LIMITES.nombre}
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Correo"
          type="email"
          inputMode="email"
          required
          autoComplete="off"
          hint="Con este correo va a ingresar"
          maxLength={LIMITES.email}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Celular"
          type="tel"
          inputMode="tel"
          hint="Opcional"
          maxLength={LIMITES.telefono}
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <Input
          label="Contraseña temporal"
          type="password"
          required
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, con letras y números. Entrégasela al mecánico."
          maxLength={LIMITES.password}
          error={errors.password?.message}
          {...register('password')}
        />
      </form>
    </BottomSheet>
  );
}
