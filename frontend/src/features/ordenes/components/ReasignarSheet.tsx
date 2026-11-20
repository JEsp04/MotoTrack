import { useState } from 'react';
import {
  Alert,
  BottomSheet,
  Button,
  Initials,
  Note,
  SelectCard,
  SkeletonList,
} from '@/components/ui';
import { useEquipo } from '@/features/equipo';
import { parseApiError } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import type { OrdenDetalle } from '@/types';
import { useReasignarMecanico } from '../hooks/use-ordenes';

/**
 * HU-63 · Hoja «Reasignar mecánico»: los mecánicos activos del taller; el actual sale marcado.
 * La orden sale de la lista del mecánico anterior y queda «Reasignado a …» en el historial.
 */
export function ReasignarSheet({
  open,
  orden,
  onClose,
}: {
  open: boolean;
  orden: OrdenDetalle;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title="Reasignar mecánico" onClose={onClose}>
      {/* Se monta al abrir: arranca con el mecánico actual */}
      {open && <Formulario orden={orden} onClose={onClose} />}
    </BottomSheet>
  );
}

function Formulario({ orden, onClose }: { orden: OrdenDetalle; onClose: () => void }) {
  const equipo = useEquipo();
  const reasignar = useReasignarMecanico(orden.publicId);
  const actual = orden.mecanico.publicId;
  const [elegido, setElegido] = useState(actual);
  const [error, setError] = useState<string | null>(null);
  const mecanicos = (equipo.data ?? []).filter(
    (u) => u.rol === 'mecanico' && u.estado === 'activo',
  );
  const nuevo = mecanicos.find((m) => m.publicId === elegido);

  async function guardar() {
    if (!nuevo || elegido === actual) return;
    setError(null);
    try {
      await reasignar.mutateAsync(elegido);
      toast(`Reasignado a ${nuevo.nombre}`, 'success');
      onClose();
    } catch (e) {
      const err = parseApiError(e);
      setError(err.fields.mecanicoPublicId ?? err.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <p className="text-sm leading-5 text-ink-muted">
        La orden #{orden.numero} sale de la lista de {orden.mecanico.nombre} y pasa a la del
        mecánico que elijas.
      </p>
      {equipo.isPending && <SkeletonList rows={2} />}
      {equipo.isError && <Alert>{parseApiError(equipo.error).message}</Alert>}
      {equipo.isSuccess && mecanicos.length <= 1 && (
        <Note icon="user">No hay otro mecánico activo en el taller.</Note>
      )}
      {mecanicos.length > 0 && (
        <div role="radiogroup" aria-label="Mecánico" className="flex flex-col gap-2">
          {mecanicos.map((m) => (
            <SelectCard
              key={m.publicId}
              checked={m.publicId === elegido}
              onSelect={() => setElegido(m.publicId)}
            >
              <Initials nombre={m.nombre} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m.nombre}</span>
                {m.publicId === actual && (
                  <span className="block text-sm leading-5 text-ink-muted">Asignado ahora</span>
                )}
              </span>
            </SelectCard>
          ))}
        </div>
      )}
      <Button
        fullWidth
        disabled={!nuevo || elegido === actual}
        loading={reasignar.isPending}
        onClick={() => void guardar()}
      >
        Reasignar
      </Button>
    </div>
  );
}
