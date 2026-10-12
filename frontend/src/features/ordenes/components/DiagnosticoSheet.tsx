import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Select, Textarea } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import type { OrdenDetalle } from '@/types';
import { useGuardarDiagnostico } from '../hooks/use-ordenes';
import { diagnosticoSchema, type DiagnosticoForm } from '../schemas/orden-schemas';

interface Props {
  open: boolean;
  orden: OrdenDetalle;
  onClose: () => void;
}

/** HU-32 · El mecánico asignado escribe o corrige el diagnóstico */
export function DiagnosticoSheet(props: Props) {
  return props.open ? <Formulario {...props} /> : null;
}

function Formulario({ orden, onClose }: Props) {
  const guardar = useGuardarDiagnostico(orden.publicId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const editando = Boolean(orden.diagnostico);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DiagnosticoForm>({
    resolver: zodResolver(diagnosticoSchema),
    mode: 'onTouched',
    defaultValues: {
      hallazgos: orden.diagnostico?.hallazgos ?? '',
      trabajoRecomendado: orden.diagnostico?.trabajoRecomendado ?? '',
      prioridad: orden.diagnostico?.prioridad ?? 'normal',
    },
  });

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    try {
      await guardar.mutateAsync(datos);
      toast(editando ? 'Diagnóstico actualizado' : 'Diagnóstico guardado', 'success');
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open
      title={editando ? 'Editar diagnóstico' : 'Diagnosticar'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-diagnostico" loading={guardar.isPending}>
            Guardar diagnóstico
          </Button>
        </>
      }
    >
      <form id="form-diagnostico" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Textarea
          label="Hallazgos"
          required
          rows={4}
          maxLength={5000}
          hint="Qué encontraste al revisar la moto"
          error={errors.hallazgos?.message}
          {...register('hallazgos')}
        />
        <Textarea
          label="Trabajo recomendado"
          required
          rows={3}
          maxLength={5000}
          error={errors.trabajoRecomendado?.message}
          {...register('trabajoRecomendado')}
        />
        <Select
          label="Prioridad"
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'urgente', label: 'Urgente: afecta la seguridad' },
          ]}
          error={errors.prioridad?.message}
          {...register('prioridad')}
        />
      </form>
    </BottomSheet>
  );
}
