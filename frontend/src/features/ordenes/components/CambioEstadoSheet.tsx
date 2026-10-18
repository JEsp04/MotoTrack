import { useState } from 'react';
import {
  Alert,
  BottomSheet,
  Button,
  HoldButton,
  Icon,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { EstadoOrden } from '@/types';
import { ETIQUETA_ESTADO } from '../textos';
import type { Accion } from '../estados';
import { useCambiarEstado } from '../hooks/use-ordenes';

export interface CambioEstadoSheetProps {
  ordenPublicId: string;
  estadoActual: EstadoOrden;
  accion: Accion | null;
  /** Se muestra al aprobar o rechazar, para evitar errores (HU-34) */
  total: number;
  onClose: () => void;
}

/**
 * Hoja «Cambiar estado» del prototipo: de qué estado a cuál pasa, la observación y el botón
 * de mantener presionado. No cambia nada en pantalla hasta que el servidor confirme (HU-35).
 */
export function CambioEstadoSheet(props: CambioEstadoSheetProps) {
  return props.accion ? <Formulario {...props} accion={props.accion} /> : null;
}

function Formulario({
  ordenPublicId,
  estadoActual,
  accion,
  total,
  onClose,
}: CambioEstadoSheetProps & { accion: Accion }) {
  const cambiar = useCambiarEstado(ordenPublicId);
  const [observacion, setObservacion] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const obligatoria = Boolean(accion.observacion?.obligatoria);
  const falta = obligatoria && !observacion.trim();

  async function enviar() {
    setErrorGeneral(null);
    if (falta) {
      setErrorCampo('Escribe la observación para continuar');
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
      title="Cambiar estado"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <HoldButton
            label="Mantén para confirmar"
            doneLabel="Suelta para confirmar"
            variant={accion.a === 'cancelada' ? 'danger' : 'primary'}
            loading={cambiar.isPending}
            disabled={falta}
            onConfirm={enviar}
            className="min-h-[50px] flex-[1.6]! text-[15px]"
          />
        </>
      }
    >
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge estado={estadoActual} />
        <Icon name="chevronRight" className="text-ink-muted" />
        <StatusBadge estado={accion.a} />
      </div>
      {accion.confirmar && (
        <p className="text-sm leading-5 text-ink-muted">{accion.confirmar.texto}</p>
      )}
      {accion.mostrarTotal && total > 0 && (
        <p className="text-sm leading-5 text-ink-muted">
          Total de la cotización:{' '}
          <span className="font-semibold text-ink">{formatPesos(total)}</span>
        </p>
      )}
      <Textarea
        label="Observación"
        required={obligatoria}
        placeholder={
          accion.observacion?.placeholder ??
          (accion.a === 'cancelada' ? 'Motivo del rechazo' : 'Opcional: qué se hizo, qué sigue…')
        }
        hint="Queda en el historial con fecha, hora y tu usuario."
        maxLength={1000}
        rows={3}
        value={observacion}
        error={errorCampo ?? undefined}
        onChange={(e) => {
          setObservacion(e.target.value);
          setErrorCampo(null);
        }}
      />
    </BottomSheet>
  );
}
