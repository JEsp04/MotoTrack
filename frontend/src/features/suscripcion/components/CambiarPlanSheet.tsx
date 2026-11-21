import { useState } from 'react';
import { BottomSheet, Button } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import type { PlanTaller } from '@/types';
import { useCambiarPlan } from '../hooks/use-suscripcion';
import { OTRO_PLAN, PLANES } from '../planes';
import { OpcionPlan } from './OpcionPlan';

/**
 * HU-80 · «Cambiar plan» (hoja del prototipo): muestra el otro plan con lo que gana o pierde.
 * Sin plan, deja elegir cualquiera de los dos.
 */
export function CambiarPlanSheet({
  open,
  actual,
  onClose,
}: {
  open: boolean;
  /** Plan actual; null si el taller aún no tiene */
  actual: PlanTaller | null;
  onClose: () => void;
}) {
  const opciones: PlanTaller[] = actual ? [OTRO_PLAN[actual]] : ['basico', 'inteligente'];
  const [elegido, setElegido] = useState<PlanTaller>(opciones[0]!);
  const plan = opciones.includes(elegido) ? elegido : opciones[0]!;
  const cambiar = useCambiarPlan();

  function confirmar() {
    cambiar.mutate(plan, {
      onSuccess: () => {
        toast(`Listo: tu taller ahora tiene el plan ${PLANES[plan].nombre}`, 'success');
        onClose();
      },
      onError: (e) => toast(parseApiError(e).message, 'danger'),
    });
  }

  return (
    <BottomSheet
      open={open}
      title={actual ? 'Cambiar plan' : 'Elige tu plan'}
      onClose={onClose}
      footer={
        <Button fullWidth loading={cambiar.isPending} onClick={confirmar}>
          {actual ? `Continuar con ${PLANES[plan].nombre}` : `Elegir ${PLANES[plan].nombre}`}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Planes" className="flex flex-col gap-2">
          {opciones.map((p) => (
            <OpcionPlan
              key={p}
              plan={p}
              checked={p === plan}
              onSelect={() => setElegido(p)}
              texto={actual === 'inteligente' ? PLANES.basico.pierde : PLANES[p].gana}
            />
          ))}
        </div>
        <p className="text-sm leading-5 text-ink-muted">
          {actual
            ? 'El cambio aplica desde hoy y el cobro se ajusta en tu próxima factura.'
            : 'El primer cobro es hoy; después, el mismo día de cada mes.'}
        </p>
      </div>
    </BottomSheet>
  );
}
