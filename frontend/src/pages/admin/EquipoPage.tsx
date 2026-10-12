import { useState } from 'react';
import { Alert, AppBar, Badge, Button, Card, EmptyState, SkeletonList } from '@/components/ui';
import { NuevoMecanicoSheet, useCambiarEstado, useEquipo } from '@/features/equipo';
import { parseApiError } from '@/lib/api-error';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Integrante } from '@/types';

/** HU-23 · Equipo del taller: crear mecánicos y activarlos o desactivarlos. */
export default function EquipoPage() {
  const equipo = useEquipo();
  const [creando, setCreando] = useState(false);
  const mecanicos = (equipo.data ?? []).filter((u) => u.rol === 'mecanico');
  const agregar = (
    <Button icon="plus" size="sm" onClick={() => setCreando(true)}>
      Agregar mecánico
    </Button>
  );

  return (
    <>
      <AppBar title="Equipo" subtitle="Mecánicos del taller" actions={agregar} />
      <div className="flex flex-col gap-3 p-4 lg:px-0">
        {equipo.isPending && <SkeletonList rows={3} />}
        {equipo.isError && (
          <Alert>
            {parseApiError(equipo.error).message}{' '}
            <button type="button" className="underline" onClick={() => equipo.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {equipo.isSuccess && mecanicos.length === 0 && (
          <EmptyState
            icon="team"
            title="Aún no tienes mecánicos"
            text="Crea la cuenta de cada mecánico para asignarle órdenes."
            action={agregar}
          />
        )}
        {mecanicos.length > 0 && (
          <ul className="flex flex-col gap-3" aria-label="Mecánicos">
            {mecanicos.map((m) => (
              <li key={m.publicId}>
                <TarjetaMecanico mecanico={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <NuevoMecanicoSheet open={creando} onClose={() => setCreando(false)} />
    </>
  );
}

function TarjetaMecanico({ mecanico }: { mecanico: Integrante }) {
  const cambiar = useCambiarEstado();
  const activo = mecanico.estado === 'activo';

  async function alternar() {
    try {
      await cambiar.mutateAsync({
        publicId: mecanico.publicId,
        estado: activo ? 'inactivo' : 'activo',
      });
      toast(
        activo
          ? `${mecanico.nombre} ya no puede ingresar. Su historial se conserva.`
          : `${mecanico.nombre} puede ingresar de nuevo`,
        'success',
      );
    } catch (error) {
      toast(parseApiError(error).message, 'danger');
    }
  }

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{mecanico.nombre}</p>
          <Badge tono={activo ? 'success' : 'neutral'} dot>
            {activo ? 'Activo' : 'Desactivado'}
          </Badge>
        </div>
        <p className="truncate text-sm text-ink-muted">{mecanico.email}</p>
        <p className="text-xs text-ink-muted">
          {mecanico.ultimoAcceso
            ? `Último ingreso: ${formatFecha(mecanico.ultimoAcceso)}`
            : 'Aún no ha ingresado'}
        </p>
      </div>
      <Button
        variant={activo ? 'secondary' : 'primary'}
        size="sm"
        loading={cambiar.isPending}
        onClick={alternar}
        aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${mecanico.nombre}`}
      >
        {activo ? 'Desactivar' : 'Activar'}
      </Button>
    </Card>
  );
}
