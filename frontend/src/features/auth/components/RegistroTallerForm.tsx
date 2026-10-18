import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import type { Usuario } from '@/types';
import { useRegistroTaller } from '../hooks/use-auth';
import {
  LIMITES,
  registroTallerSchema,
  type RegistroTallerForm as Valores,
} from '../schemas/auth-schemas';

const CAMPOS_PASO_1 = [
  'taller.nombre',
  'taller.nit',
  'taller.telefono',
  'taller.direccion',
] as const;

/** HU-20 · Registro del taller y su administrador en 2 pasos. */
export function RegistroTallerForm({ onRegistro }: { onRegistro: (usuario: Usuario) => void }) {
  const registro = useRegistroTaller();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(registroTallerSchema),
    mode: 'onTouched',
    // Un solo formulario para los 2 pasos: al volver, lo escrito se conserva
    defaultValues: {
      taller: { nombre: '', nit: '', telefono: '', direccion: '' },
      admin: { nombre: '', email: '', telefono: '', password: '', confirmar: '' },
    },
  });

  async function siguiente() {
    if (await trigger([...CAMPOS_PASO_1], { shouldFocus: true })) setPaso(2);
  }

  const onSubmit = handleSubmit(
    async ({ taller, admin }) => {
      setErrorGeneral(null);
      try {
        const { usuario } = await registro.mutateAsync({
          taller: {
            nombre: taller.nombre,
            telefono: taller.telefono,
            nit: taller.nit || undefined,
            direccion: taller.direccion || undefined,
          },
          admin: {
            nombre: admin.nombre,
            email: admin.email,
            password: admin.password,
            telefono: admin.telefono || undefined,
          },
        });
        onRegistro(usuario);
      } catch (error) {
        const e = parseApiError(error);
        // El backend responde el correo repetido como "email"
        const campos = aplicarErroresDeCampo(setError, e, { email: 'admin.email' });
        if (campos.some((c) => c.startsWith('taller.'))) setPaso(1);
        if (campos.length === 0) setErrorGeneral(e.message);
      }
    },
    // Si algo del paso 1 quedó mal, se vuelve a ese paso
    (errores) => {
      if (errores.taller) setPaso(1);
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <ol className="flex gap-2" aria-label="Pasos del registro">
        {[
          { n: 1, label: 'Tu taller' },
          { n: 2, label: 'Tu cuenta' },
        ].map(({ n, label }) => (
          <li
            key={n}
            aria-current={paso === n ? 'step' : undefined}
            className="flex flex-1 flex-col gap-1.5"
          >
            <span
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                paso > n ? 'bg-ink' : paso === n ? 'bg-accent' : 'bg-surface-2'
              }`}
              aria-hidden="true"
            />
            <span className={`text-xs font-semibold ${paso === n ? 'text-ink' : 'text-ink-muted'}`}>
              Paso {n} de 2 · {label}
            </span>
          </li>
        ))}
      </ol>

      {errorGeneral && <Alert>{errorGeneral}</Alert>}

      <div className={paso === 1 ? 'flex flex-col gap-4' : 'hidden'}>
        <Input
          label="Nombre del taller"
          required
          autoComplete="organization"
          error={errors.taller?.nombre?.message}
          maxLength={LIMITES.nombre}
          {...register('taller.nombre')}
        />
        <Input
          label="Teléfono del taller"
          type="tel"
          inputMode="tel"
          required
          placeholder="604 444 1234"
          error={errors.taller?.telefono?.message}
          maxLength={LIMITES.telefono}
          {...register('taller.telefono')}
        />
        <Input
          label="NIT"
          hint="Opcional"
          inputMode="numeric"
          placeholder="901234567-8"
          error={errors.taller?.nit?.message}
          maxLength={LIMITES.nit}
          {...register('taller.nit')}
        />
        <Input
          label="Dirección"
          hint="Opcional"
          autoComplete="street-address"
          error={errors.taller?.direccion?.message}
          maxLength={LIMITES.direccion}
          {...register('taller.direccion')}
        />
        <Button fullWidth onClick={siguiente}>
          Siguiente
        </Button>
      </div>

      <div className={paso === 2 ? 'flex flex-col gap-4' : 'hidden'}>
        <Input
          label="Tu nombre"
          required
          autoComplete="name"
          error={errors.admin?.nombre?.message}
          maxLength={LIMITES.nombre}
          {...register('admin.nombre')}
        />
        <Input
          label="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          error={errors.admin?.email?.message}
          maxLength={LIMITES.email}
          {...register('admin.email')}
        />
        <Input
          label="Celular"
          type="tel"
          inputMode="tel"
          hint="Opcional"
          autoComplete="tel"
          error={errors.admin?.telefono?.message}
          maxLength={LIMITES.telefono}
          {...register('admin.telefono')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          required
          hint="Mínimo 8 caracteres, con letras y números"
          error={errors.admin?.password?.message}
          maxLength={LIMITES.password}
          {...register('admin.password')}
        />
        <Input
          label="Confirma la contraseña"
          type="password"
          autoComplete="new-password"
          required
          error={errors.admin?.confirmar?.message}
          maxLength={LIMITES.password}
          {...register('admin.confirmar')}
        />
        <div className="flex gap-3">
          <Button variant="secondary" icon="back" onClick={() => setPaso(1)}>
            Atrás
          </Button>
          <Button type="submit" className="flex-1" loading={registro.isPending}>
            Crear mi taller
          </Button>
        </div>
      </div>
    </form>
  );
}
