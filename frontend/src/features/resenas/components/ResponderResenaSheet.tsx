import { useState } from 'react';
import { Alert, BottomSheet, Button, Estrellas, Segmented, Textarea } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { ESTADO_RESENA_LABEL } from '@/lib/resenas';
import { toast } from '@/lib/toast';
import type { ResenaAdmin } from '@/types';
import { useActualizarResena } from '../hooks/use-resenas';

const MAX_RESPUESTA = 500;

type Seguimiento = 'revisada' | 'adaptada';

/**
 * HU-89 · Responder una reseña y marcar su seguimiento: «Revisada» o «Mejora adaptada».
 * Al guardar una respuesta nueva, el cliente recibe un aviso.
 */
export function ResponderResenaSheet({
  resena,
  onClose,
}: {
  resena: ResenaAdmin | null;
  onClose: () => void;
}) {
  return resena ? <Formulario key={resena.publicId} resena={resena} onClose={onClose} /> : null;
}

function Formulario({ resena, onClose }: { resena: ResenaAdmin; onClose: () => void }) {
  const actualizar = useActualizarResena();
  const [respuesta, setRespuesta] = useState(resena.respuestaAdmin ?? '');
  const [estado, setEstado] = useState<Seguimiento>(
    resena.estado === 'adaptada' ? 'adaptada' : 'revisada',
  );
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    try {
      await actualizar.mutateAsync({
        publicId: resena.publicId,
        respuestaAdmin: respuesta.trim() || null,
        estado,
      });
      toast(respuesta.trim() ? 'Respuesta enviada al cliente' : 'Reseña actualizada', 'success');
      onClose();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <BottomSheet
      open
      title="Responder reseña"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={actualizar.isPending} onClick={() => void guardar()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <div className="rounded-md bg-surface-sunken p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold">{resena.cliente.nombre}</p>
            <Estrellas valor={resena.calificacion} size={16} />
          </div>
          <p className="text-sm leading-5 text-ink-muted">
            {resena.comentario ? `«${resena.comentario}»` : 'Sin comentario'}
          </p>
        </div>
        <Textarea
          label="Respuesta al cliente"
          hint="El cliente la ve en el seguimiento de su orden"
          maxLength={MAX_RESPUESTA}
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-5 font-semibold">Seguimiento</p>
          <Segmented
            label="Seguimiento"
            value={estado}
            onChange={setEstado}
            options={[
              { id: 'revisada', label: ESTADO_RESENA_LABEL.revisada },
              { id: 'adaptada', label: ESTADO_RESENA_LABEL.adaptada },
            ]}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
