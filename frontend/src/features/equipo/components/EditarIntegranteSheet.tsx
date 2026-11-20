import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, BottomSheet, Button, Input, Segmented } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES, maximo, obligatorio, telefonoOpcional } from '@/lib/validaciones';
import type { Integrante } from '@/types';
import { useActualizarIntegrante } from '../hooks/use-equipo';

const schema = z.object({
  nombre: obligatorio('El nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  telefono: telefonoOpcional,
  rol: z.enum(['admin', 'mecanico'], { error: 'Elige el rol' }),
});
type Valores = z.infer<typeof schema>;

/**
 * HU-87 · El admin corrige nombre, celular y rol (mecánico ↔ administrador) de alguien del
 * equipo. El backend no deja al taller sin un administrador activo.
 */
export function EditarIntegranteSheet({
  integrante,
  onClose,
}: {
  integrante: Integrante;
  onClose: () => void;
}) {
  const actualizar = useActualizarIntegrante();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Valores>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      nombre: integrante.nombre,
      telefono: integrante.telefono ?? '',
      rol: integrante.rol,
    },
  });

  const onSubmit = handleSubmit(async ({ telefono, ...datos }) => {
    setErrorGeneral(null);
    try {
      const guardado = await actualizar.mutateAsync({
        publicId: integrante.publicId,
        body: { ...datos, telefono: telefono || null },
      });
      toast(
        guardado.rol !== integrante.rol
          ? `${guardado.nombre} ahora es ${guardado.rol === 'admin' ? 'administrador' : 'mecánico'}. Debe ingresar de nuevo.`
          : `Guardamos los datos de ${guardado.nombre}`,
        'success',
      );
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open
      title="Editar datos"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-integrante" loading={actualizar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-integrante" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
          label="Celular"
          hint="Opcional"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITES.telefono}
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <div className="flex flex-col gap-2">
          <Controller
            control={control}
            name="rol"
            render={({ field }) => (
              <Segmented
                label="Rol"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { id: 'mecanico', label: 'Mecánico' },
                  { id: 'admin', label: 'Administrador' },
                ]}
              />
            )}
          />
          {errors.rol?.message ? (
            <p className="text-sm leading-5 text-danger-text" role="alert">
              {errors.rol.message}
            </p>
          ) : (
            <p className="text-sm leading-5 text-ink-muted">
              Si cambias el rol, debe ingresar de nuevo para ver sus nuevas opciones.
            </p>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}
