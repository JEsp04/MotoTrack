import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input, Select } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useAgregarServicio, useCatalogoServicios } from '../hooks/use-ordenes';
import {
  servicioSchema,
  type ServicioFormOutput,
  type ServicioFormValues,
} from '../schemas/orden-schemas';

interface Props {
  open: boolean;
  ordenPublicId: string;
  onClose: () => void;
}

/** HU-33 · Agregar un servicio del catálogo; el total lo recalcula el backend */
export function ServicioSheet(props: Props) {
  return props.open ? <Formulario {...props} /> : null;
}

function Formulario({ ordenPublicId, onClose }: Props) {
  const catalogo = useCatalogoServicios();
  const agregar = useAgregarServicio(ordenPublicId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ServicioFormValues, unknown, ServicioFormOutput>({
    resolver: zodResolver(servicioSchema),
    mode: 'onTouched',
    defaultValues: { servicioPublicId: '', cantidad: '1', precioUnitario: '' },
  });
  const elegido = useWatch({ control, name: 'servicioPublicId' });
  const servicio = catalogo.data?.find((s) => s.publicId === elegido);

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      await agregar.mutateAsync(datos);
      toast('Servicio agregado', 'success');
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open
      title="Agregar servicio"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-servicio" loading={agregar.isPending}>
            Agregar
          </Button>
        </>
      }
    >
      <form id="form-servicio" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Select
          label="Servicio"
          required
          placeholder={catalogo.isPending ? 'Cargando servicios…' : 'Elige un servicio'}
          disabled={catalogo.isPending}
          options={(catalogo.data ?? []).map((s) => ({
            value: s.publicId,
            label: `${s.nombre} · ${formatPesos(s.precioBase)}`,
          }))}
          error={errors.servicioPublicId?.message}
          {...register('servicioPublicId')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cantidad"
            inputMode="numeric"
            maxLength={2}
            error={errors.cantidad?.message}
            {...register('cantidad')}
          />
          <Input
            label="Precio unitario"
            inputMode="numeric"
            maxLength={11}
            placeholder={servicio ? String(servicio.precioBase) : undefined}
            hint={servicio ? `Del catálogo: ${formatPesos(servicio.precioBase)}` : 'En pesos'}
            error={errors.precioUnitario?.message}
            {...register('precioUnitario')}
          />
        </div>
      </form>
    </BottomSheet>
  );
}
