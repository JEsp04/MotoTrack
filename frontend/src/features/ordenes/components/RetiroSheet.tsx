import { useState } from 'react';
import { Alert, BottomSheet, Button, HoldButton } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import { CODIGO_COMPLETO, FALTA_CODIGO } from '../codigo-retiro';
import { useRegistrarRetiro } from '../hooks/use-ordenes';
import { CampoCodigo } from './CampoCodigo';

/**
 * HU-66 · «Registrar retiro sin reparación»: la orden se canceló y el cliente recoge la moto.
 * Pide el mismo código de retiro y se confirma manteniendo presionado.
 */
export function RetiroSheet({
  open,
  ordenPublicId,
  onClose,
}: {
  open: boolean;
  ordenPublicId: string;
  onClose: () => void;
}) {
  const retirar = useRegistrarRetiro(ordenPublicId);
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const completo = CODIGO_COMPLETO.test(codigo);

  function cerrar() {
    setCodigo('');
    setErrorCodigo(null);
    setErrorGeneral(null);
    onClose();
  }

  async function enviar() {
    setErrorGeneral(null);
    if (!completo) {
      setErrorCodigo(FALTA_CODIGO);
      return;
    }
    try {
      await retirar.mutateAsync(codigo);
      toast('Retiro registrado', 'success');
      cerrar();
    } catch (error) {
      const e = parseApiError(error);
      if (e.fields.codigo) setErrorCodigo(e.fields.codigo);
      else setErrorGeneral(e.message);
    }
  }

  return (
    <BottomSheet
      open={open}
      title="Registrar retiro sin reparación"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <HoldButton
            label="Mantén para confirmar"
            doneLabel="Suelta para confirmar"
            loading={retirar.isPending}
            disabled={!completo}
            onConfirm={enviar}
            className="min-h-13 flex-[1.6]! text-[15px]"
          />
        </>
      }
    >
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      <p className="text-sm leading-5 text-ink-muted">
        La orden sigue cancelada y el retiro queda en el historial.
      </p>
      <CampoCodigo
        valor={codigo}
        error={errorCodigo}
        onChange={(v) => {
          setCodigo(v);
          setErrorCodigo(null);
        }}
      />
    </BottomSheet>
  );
}
