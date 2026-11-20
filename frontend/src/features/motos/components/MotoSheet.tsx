import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { Moto } from '@/types';
import { useActualizarMoto, useCrearMoto, useEliminarMoto } from '../hooks/use-motos';
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
  /** Tras guardar (por ejemplo, para elegirla en una orden nueva) */
  onGuardada?: (moto: Moto) => void;
}

/**
 * HU-26 · Agregar o editar una moto (admin desde el cliente; cliente desde "Mis motos").
 * HU-87 · Con una orden abierta la placa no se puede cambiar, y una moto registrada por error
 * se puede eliminar (el backend lo impide si ya tiene órdenes o citas).
 */
export function MotoSheet(props: MotoSheetProps) {
  // El formulario se monta al abrir: así siempre arranca limpio o con los datos de la moto
  return props.open ? <FormularioMoto {...props} /> : null;
}

function FormularioMoto({ onClose, moto, clientePublicId, onGuardada }: MotoSheetProps) {
  const crear = useCrearMoto();
  const actualizar = useActualizarMoto();
  const eliminar = useEliminarMoto();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const editando = Boolean(moto);
  const ordenAbierta = moto?.ordenActiva ?? null;

  async function confirmarBorrado() {
    if (!moto) return;
    try {
      await eliminar.mutateAsync(moto.publicId);
      toast(`Eliminamos la moto ${moto.placa}`, 'success');
      onClose();
    } catch (error) {
      setBorrando(false);
      setErrorGeneral(parseApiError(error).message);
    }
  }

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
      const guardada = moto
        ? await actualizar.mutateAsync({ publicId: moto.publicId, body: datos })
        : await crear.mutateAsync({ ...datos, clientePublicId });
      toast(moto ? 'Moto actualizada' : 'Moto registrada', 'success');
      onClose();
      onGuardada?.(guardada);
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  if (moto && borrando) {
    return (
      <BottomSheet
        open
        title="Eliminar moto"
        onClose={() => setBorrando(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBorrando(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminar.isPending}
              onClick={() => void confirmarBorrado()}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          Vamos a eliminar la moto{' '}
          <span className="font-semibold">
            {moto.placa} · {moto.marca} {moto.referencia}
          </span>
          .
        </p>
        <p className="text-sm leading-5 text-ink-muted">
          Úsalo solo si se registró por error. Si ya tiene órdenes o citas, no se puede eliminar
          para conservar su historial.
        </p>
      </BottomSheet>
    );
  }

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
          hint={
            ordenAbierta
              ? `No se puede cambiar: tiene la orden #${ordenAbierta.numero} abierta`
              : '3 letras, 2 números y 1 letra (o 3 letras y 2 números)'
          }
          readOnly={Boolean(ordenAbierta)}
          maxLength={LIMITES.placa}
          className={cn(
            '[&_input]:uppercase',
            ordenAbierta && '[&_input]:cursor-not-allowed [&_input]:bg-surface-sunken',
          )}
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
        {moto && !ordenAbierta && (
          <Button variant="ghost" icon="trash" onClick={() => setBorrando(true)}>
            Eliminar moto
          </Button>
        )}
      </form>
    </BottomSheet>
  );
}
