import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { Moto } from '@/types';
import { useActualizarMoto, useCrearMoto } from '../hooks/use-motos';
import {
  anioMaximo,
  MOTO_VACIA,
  motoSchema,
  valoresDeMoto,
  type MotoFormOutput,
  type MotoFormValues,
} from '../schemas/moto-schema';

export interface MotoSheetProps {
  open: boolean;
  onClose: () => void;
  /** Si se pasa, el formulario edita esa moto */
  moto?: Moto | null;
  /** Admin: cliente al que se le registra la moto. El cliente no lo envía. */
  clientePublicId?: string;
}

/** HU-26 · Agregar o editar una moto (admin desde el cliente; cliente desde "Mis motos"). */
export function MotoSheet(props: MotoSheetProps) {
  // El formulario se monta al abrir: así siempre arranca limpio o con los datos de la moto
  return props.open ? <FormularioMoto {...props} /> : null;
}

function FormularioMoto({ onClose, moto, clientePublicId }: MotoSheetProps) {
  const crear = useCrearMoto();
  const actualizar = useActualizarMoto();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const editando = Boolean(moto);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MotoFormValues, unknown, MotoFormOutput>({
    resolver: zodResolver(motoSchema),
    mode: 'onTouched',
    defaultValues: moto ? valoresDeMoto(moto) : MOTO_VACIA,
  });

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      if (moto) {
        await actualizar.mutateAsync({ publicId: moto.publicId, body: datos });
        toast('Moto actualizada', 'success');
      } else {
        await crear.mutateAsync({ ...datos, clientePublicId });
        toast('Moto registrada', 'success');
      }
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open
      title={editando ? 'Editar moto' : 'Agregar moto'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-moto" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar cambios' : 'Guardar moto'}
          </Button>
        </>
      }
    >
      <form id="form-moto" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Placa"
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABC12D"
          hint="3 letras, 2 números y 1 letra (o 3 letras y 2 números)"
          maxLength={LIMITES.placa}
          className="[&_input]:uppercase"
          error={errors.placa?.message}
          {...register('placa')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Marca"
            required
            placeholder="Yamaha"
            maxLength={LIMITES.marca}
            error={errors.marca?.message}
            {...register('marca')}
          />
          <Input
            label="Referencia"
            required
            placeholder="NMAX 155"
            maxLength={LIMITES.referencia}
            error={errors.referencia?.message}
            {...register('referencia')}
          />
          <Input
            label="Modelo (año)"
            required
            inputMode="numeric"
            placeholder={String(anioMaximo() - 1)}
            maxLength={4}
            error={errors.modelo?.message}
            {...register('modelo')}
          />
          <Input
            label="Cilindraje (cc)"
            inputMode="numeric"
            hint="Opcional"
            maxLength={4}
            error={errors.cilindraje?.message}
            {...register('cilindraje')}
          />
          <Input
            label="Color"
            hint="Opcional"
            maxLength={LIMITES.color}
            error={errors.color?.message}
            {...register('color')}
          />
          <Input
            label="Kilometraje"
            inputMode="numeric"
            hint="Opcional"
            maxLength={9}
            error={errors.kilometraje?.message}
            {...register('kilometraje')}
          />
        </div>
      </form>
    </BottomSheet>
  );
}
