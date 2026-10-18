import { useState } from 'react';
import { Alert, BottomSheet, Button, HoldButton, Textarea } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import { ETIQUETA_ESTADO, textoHold } from '../textos';
import type { Accion } from '../estados';
import { useCambiarEstado } from '../hooks/use-ordenes';

export interface CambioEstadoSheetProps {
  ordenPublicId: string;
  accion: Accion | null;
  /** Se muestra al aprobar o rechazar, para evitar errores (HU-34) */
  total: number;
  onClose: () => void;
}

/**
 * Confirmación de un cambio de estado. Pide la observación cuando hace falta
 * (motivo, repuesto) y no cambia nada en pantalla hasta que el servidor confirme (HU-35).
 */
export function CambioEstadoSheet(props: CambioEstadoSheetProps) {
  return props.accion ? <Formulario {...props} accion={props.accion} /> : null;
}

function Formulario({
  ordenPublicId,
  accion,
  total,
  onClose,
}: CambioEstadoSheetProps & { accion: Accion }) {
  const cambiar = useCambiarEstado(ordenPublicId);
  const [observacion, setObservacion] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const confirmar = accion.confirmar;

  async function enviar() {
    setErrorGeneral(null);
    if (accion.observacion?.obligatoria && !observacion.trim()) {
      setErrorCampo(`${accion.observacion.label}: escríbelo para continuar`);
      return;
    }
    try {
      await cambiar.mutateAsync({ estado: accion.a, observacion: observacion.trim() || undefined });
      toast(`Orden: ${ETIQUETA_ESTADO[accion.a]}`, 'success');
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (e.fields.observacion) setErrorCampo(e.fields.observacion);
      else setErrorGeneral(e.message);
    }
  }

  return (
    <BottomSheet
      open
      title={confirmar?.titulo ?? accion.label}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Volver
          </Button>
          {/* Se confirma manteniendo presionado (HU-48) */}
          <HoldButton
            label={textoHold(accion.label).mantener}
            doneLabel={textoHold(accion.label).soltar}
            variant={accion.a === 'cancelada' ? 'danger' : 'primary'}
            loading={cambiar.isPending}
            onConfirm={enviar}
            className="flex-[1.6]"
          />
        </>
      }
    >
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      {confirmar && <p className="text-ink-muted">{confirmar.texto}</p>}
      {accion.mostrarTotal && (
        <div className="flex items-center justify-between rounded-sm bg-surface-sunken px-4 py-3">
          <span className="font-semibold">Total</span>
          <span className="font-num text-xl">{formatPesos(total)}</span>
        </div>
      )}
      {accion.observacion && (
        <Textarea
          label={accion.observacion.label}
          required={accion.observacion.obligatoria}
          placeholder={accion.observacion.placeholder}
          maxLength={1000}
          rows={3}
          value={observacion}
          error={errorCampo ?? undefined}
          onChange={(e) => {
            setObservacion(e.target.value);
            setErrorCampo(null);
          }}
        />
      )}
    </BottomSheet>
  );
}
