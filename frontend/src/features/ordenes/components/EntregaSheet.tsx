import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import type { OrdenDetalle } from '@/types';
import { useCambiarEntrega } from '../hooks/use-ordenes';
import { entregaSchema, type EntregaForm } from '../schemas/orden-schemas';

interface Props {
  open: boolean;
  orden: OrdenDetalle;
  onClose: () => void;
}

/** Día de ingreso en Colombia («AAAA-MM-DD»): la entrega no puede ser antes */
const diaIngreso = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date(iso));

/** HU-62 · El admin pone o cambia la fecha estimada de entrega */
export function EntregaSheet(props: Props) {
  return props.open ? <Formulario {...props} /> : null;
}

function Formulario({ orden, onClose }: Props) {
  const guardar = useCambiarEntrega(orden.publicId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const minimo = diaIngreso(orden.fechaIngreso);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EntregaForm>({
    resolver: zodResolver(entregaSchema),
    mode: 'onTouched',
    defaultValues: { fechaEstimadaEntrega: orden.fechaEstimadaEntrega ?? '' },
  });

  const onSubmit = handleSubmit(async ({ fechaEstimadaEntrega }) => {
    setErrorGeneral(null);
    if (fechaEstimadaEntrega && fechaEstimadaEntrega < minimo) {
      setError('fechaEstimadaEntrega', {
        message: 'La fecha estimada de entrega no puede ser anterior a la fecha de ingreso',
      });
      return;
    }
    try {
      await guardar.mutateAsync(fechaEstimadaEntrega || null);
      toast(
        fechaEstimadaEntrega ? 'Entrega estimada guardada' : 'Entrega estimada quitada',
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
      title="Entrega estimada"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-entrega" loading={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-entrega" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Entrega estimada"
          type="date"
          min={minimo}
          hint="Déjala vacía para quitarla. El cliente la ve en el seguimiento."
          error={errors.fechaEstimadaEntrega?.message}
          {...register('fechaEstimadaEntrega')}
        />
      </form>
    </BottomSheet>
  );
}
