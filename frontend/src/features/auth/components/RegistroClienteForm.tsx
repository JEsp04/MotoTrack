import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input, Select } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import type { Usuario } from '@/types';
import { useRegistroCliente, useTalleresPublicos } from '../hooks/use-auth';
import {
  registroClienteSchema,
  type RegistroClienteForm as Valores,
} from '../schemas/auth-schemas';

/** HU-20 · Registro de un cliente: elige su taller y crea su cuenta. */
export function RegistroClienteForm({ onRegistro }: { onRegistro: (usuario: Usuario) => void }) {
  const registro = useRegistroCliente();
  const talleres = useTalleresPublicos();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(registroClienteSchema),
    mode: 'onTouched',
    defaultValues: {
      tallerId: '',
      nombre: '',
      documentoIdentidad: '',
      telefono: '',
      email: '',
      password: '',
      confirmar: '',
    },
  });

  const onSubmit = handleSubmit(async ({ confirmar: _confirmar, tallerId, ...datos }) => {
    setErrorGeneral(null);
    try {
      const { usuario } = await registro.mutateAsync({ ...datos, tallerId: Number(tallerId) });
      onRegistro(usuario);
    } catch (error) {
      const e = parseApiError(error);
      const campos = aplicarErroresDeCampo(setError, e);
      if (campos.length === 0) setErrorGeneral(e.message);
    }
  });

  const opciones = (talleres.data ?? []).map((t) => ({
    value: String(t.tallerId),
    label: t.direccion ? `${t.nombre} · ${t.direccion}` : t.nombre,
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      {talleres.isError && (
        <Alert>
          No pudimos cargar los talleres.{' '}
          <button type="button" className="underline" onClick={() => talleres.refetch()}>
            Intentar de nuevo
          </button>
        </Alert>
      )}

      <Select
        label="Tu taller"
        required
        placeholder={talleres.isLoading ? 'Cargando talleres…' : 'Elige tu taller'}
        disabled={talleres.isLoading}
        options={opciones}
        hint="El taller donde llevas tu moto"
        error={errors.tallerId?.message}
        {...register('tallerId')}
      />
      <Input
        label="Nombre completo"
        required
        autoComplete="name"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <Input
        label="Documento de identidad"
        required
        inputMode="numeric"
        hint="Sin puntos. Si el taller ya te registró, verás tus motos al entrar."
        error={errors.documentoIdentidad?.message}
        {...register('documentoIdentidad')}
      />
      <Input
        label="Celular"
        type="tel"
        inputMode="tel"
        required
        autoComplete="tel"
        placeholder="300 123 4567"
        error={errors.telefono?.message}
        {...register('telefono')}
      />
      <Input
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres, con letras y números"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirma la contraseña"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmar?.message}
        {...register('confirmar')}
      />

      <Button type="submit" fullWidth loading={registro.isPending}>
        Crear mi cuenta
      </Button>
    </form>
  );
}
