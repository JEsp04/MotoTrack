import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Button, Input, Select } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import type { Usuario } from '@/types';
import { useRegistroCliente, useTalleresPublicos } from '../hooks/use-auth';
import {
  LIMITES,
  registroClienteSchema,
  type RegistroClienteForm as Valores,
} from '../schemas/auth-schemas';
import { TerminosSheet } from './TerminosSheet';

/** HU-20, HU-83 · Registro de un cliente: elige su taller y crea su cuenta. */
export function RegistroClienteForm({ onRegistro }: { onRegistro: (usuario: Usuario) => void }) {
  const registro = useRegistroCliente();
  const talleres = useTalleresPublicos();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [verTerminos, setVerTerminos] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(registroClienteSchema),
    mode: 'onTouched',
    defaultValues: {
      tallerPublicId: '',
      nombre: '',
      documentoIdentidad: '',
      telefono: '',
      email: '',
      password: '',
      confirmar: '',
    },
  });

  const onSubmit = handleSubmit(async ({ confirmar: _confirmar, ...datos }) => {
    setErrorGeneral(null);
    try {
      const { usuario } = await registro.mutateAsync(datos);
      onRegistro(usuario);
    } catch (error) {
      const e = parseApiError(error);
      const campos = aplicarErroresDeCampo(setError, e);
      if (campos.length === 0) setErrorGeneral(e.message);
    }
  });

  const opciones = (talleres.data ?? []).map((t) => ({
    value: t.publicId,
    label: t.direccion ? `${t.nombre} · ${t.direccion}` : t.nombre,
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      {talleres.isError && (
        <Alert>
          No pudimos cargar los talleres.{' '}
          <button type="button" className="underline" onClick={() => talleres.refetch()}>
            Intentar de nuevo
          </button>
        </Alert>
      )}

      <Controller
        control={control}
        name="tallerPublicId"
        render={({ field }) => (
          <Select
            label="Tu taller"
            required
            placeholder={talleres.isLoading ? 'Cargando talleres…' : 'Elige tu taller'}
            options={opciones}
            hint="El taller donde llevas tu moto"
            error={errors.tallerPublicId?.message}
            name={field.name}
            ref={field.ref}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Input
        label="Nombre completo"
        required
        autoComplete="name"
        error={errors.nombre?.message}
        maxLength={LIMITES.nombre}
        {...register('nombre')}
      />
      <Input
        label="Documento de identidad"
        required
        inputMode="numeric"
        hint="Sin puntos. Si el taller ya te registró, verás tus motos al entrar."
        error={errors.documentoIdentidad?.message}
        maxLength={LIMITES.documento}
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
        maxLength={LIMITES.telefono}
        {...register('telefono')}
      />
      <Input
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        maxLength={LIMITES.email}
        {...register('email')}
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres, con letras y números"
        error={errors.password?.message}
        maxLength={LIMITES.password}
        {...register('password')}
      />
      <Input
        label="Confirma la contraseña"
        type="password"
        autoComplete="new-password"
        required
        error={errors.confirmar?.message}
        maxLength={LIMITES.password}
        {...register('confirmar')}
      />

      <p className="text-sm leading-5 text-ink-muted">
        Al crear tu cuenta aceptas los{' '}
        <button
          type="button"
          onClick={() => setVerTerminos(true)}
          className="font-semibold text-ink underline decoration-border-strong underline-offset-4"
        >
          términos de uso y política de datos
        </button>
        .
      </p>

      <Button type="submit" fullWidth loading={registro.isPending}>
        Crear cuenta
      </Button>
      <TerminosSheet open={verTerminos} onClose={() => setVerTerminos(false)} />
    </form>
  );
}
