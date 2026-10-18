import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import type { Usuario } from '@/types';
import { useLogin } from '../hooks/use-auth';
import { LIMITES, loginSchema, type LoginForm as LoginValues } from '../schemas/auth-schemas';

/** HU-19 · Formulario de ingreso con correo y contraseña. */
export function LoginForm({ onIngreso }: { onIngreso: (usuario: Usuario) => void }) {
  const login = useLogin();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [verAyuda, setVerAyuda] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErrorGeneral(null);
    try {
      const { usuario } = await login.mutateAsync(valores);
      onIngreso(usuario);
    } catch (error) {
      const e = parseApiError(error);
      const campos = aplicarErroresDeCampo(setError, e);
      if (campos.length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Alert>{errorGeneral}</Alert>}

      <Input
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@correo.co"
        required
        error={errors.email?.message}
        maxLength={LIMITES.email}
        {...register('email')}
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        maxLength={LIMITES.password}
        {...register('password')}
      />

      <div className="-mt-1 flex justify-end">
        <button
          type="button"
          className="min-h-touch px-1 text-sm font-semibold text-ink hover:underline"
          onClick={() => setVerAyuda((v) => !v)}
          aria-expanded={verAyuda}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      {verAyuda && (
        <Alert tono="info">
          Pídele a tu taller que te ayude a recuperarla. Pronto podrás hacerlo tú mismo desde aquí.
        </Alert>
      )}

      <Button type="submit" fullWidth loading={login.isPending}>
        Ingresar
      </Button>
    </form>
  );
}
