import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { ActionBar, Alert, AppBar, Button, Input, Page, SkeletonList } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { DatosTaller } from '@/types';
import { useActualizarTaller, useMiTaller } from '../hooks/use-taller';
import {
  datosTallerSchema,
  EJEMPLO_HORARIO,
  type DatosTallerValues,
} from '../schemas/taller-schema';

const FORM_ID = 'datos-taller';

/** HU-73 · «Datos del taller»: el admin cambia nombre, NIT, dirección, teléfono, correo y horario. */
export function DatosTallerForm() {
  const navigate = useNavigate();
  const taller = useMiTaller();
  const actualizar = useActualizarTaller();
  const { key } = useLocation();
  // HU-86: al guardar vuelve a donde estaba (en computador se entra desde el menú del avatar);
  // si se abrió directo, va a «Más»
  const volver = () => void (key === 'default' ? navigate('/admin/mas') : navigate(-1));

  return (
    <>
      <AppBar title="Datos del taller" subtitle="Más" onBack={() => void navigate(-1)} />
      <Page narrow pb="actionbar">
        {taller.isPending ? (
          <SkeletonList rows={4} />
        ) : taller.isError ? (
          <Alert>{parseApiError(taller.error).message}</Alert>
        ) : (
          <Formulario taller={taller.data} onGuardado={volver} />
        )}
      </Page>
      <ActionBar>
        <Button
          type="submit"
          form={FORM_ID}
          fullWidth
          icon="check"
          loading={actualizar.isPending}
          disabled={!taller.isSuccess}
        >
          Guardar cambios
        </Button>
      </ActionBar>
    </>
  );
}

function Formulario({ taller, onGuardado }: { taller: DatosTaller; onGuardado: () => void }) {
  const actualizar = useActualizarTaller();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosTallerValues>({
    resolver: zodResolver(datosTallerSchema),
    mode: 'onTouched',
    defaultValues: {
      nombre: taller.nombre,
      nit: taller.nit ?? '',
      direccion: taller.direccion ?? '',
      telefono: taller.telefono,
      email: taller.email ?? '',
      horarioAtencion: taller.horarioAtencion ?? '',
    },
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErrorGeneral(null);
    try {
      await actualizar.mutateAsync(valores);
      toast('Datos del taller guardados', 'success');
      onGuardado();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      <Input
        label="Nombre del taller"
        required
        autoComplete="organization"
        error={errors.nombre?.message}
        maxLength={LIMITES.nombre}
        {...register('nombre')}
      />
      <Input
        label="NIT"
        hint="Opcional"
        inputMode="numeric"
        placeholder="901234567-8"
        error={errors.nit?.message}
        maxLength={LIMITES.nit}
        {...register('nit')}
      />
      <Input
        label="Dirección"
        hint="Opcional"
        autoComplete="street-address"
        error={errors.direccion?.message}
        maxLength={LIMITES.direccion}
        {...register('direccion')}
      />
      <Input
        label="Teléfono del taller"
        type="tel"
        inputMode="tel"
        required
        placeholder="604 444 1234"
        error={errors.telefono?.message}
        maxLength={LIMITES.telefono}
        {...register('telefono')}
      />
      <Input
        label="Correo"
        type="email"
        inputMode="email"
        hint="Opcional"
        error={errors.email?.message}
        maxLength={LIMITES.email}
        {...register('email')}
      />
      <Input
        label="Horario de atención"
        hint={`Las citas usan este horario. Por ejemplo: ${EJEMPLO_HORARIO}`}
        placeholder={EJEMPLO_HORARIO}
        error={errors.horarioAtencion?.message}
        maxLength={LIMITES.horario}
        {...register('horarioAtencion')}
      />
    </form>
  );
}
