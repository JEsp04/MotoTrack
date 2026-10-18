import { useState } from 'react';
import { Alert, AppBar, Badge, Button, EmptyState, SkeletonList } from '@/components/ui';
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
      <AppBar
        title="Equipo"
        subtitle="Mecánicos del taller"
        actions={
          <Button
            icon="plus"
            size="sm"
            onClick={() => setCreando(true)}
            aria-label="Agregar mecánico"
          >
            <span className="hidden sm:inline">Agregar mecánico</span>
          </Button>
        }
      />
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
          <ul
            className="flex flex-col divide-y divide-border overflow-hidden rounded-md bg-surface-sunken"
            aria-label="Mecánicos"
          >
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
    <div className="flex items-center gap-3.5 p-4 sm:px-5">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-surface text-sm font-semibold"
        aria-hidden="true"
      >
        {mecanico.nombre
          .split(' ')
          .slice(0, 2)
          .map((p) => p[0])
          .join('')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{mecanico.nombre}</p>
          <Badge tono={activo ? 'success' : 'neutral'} icon={activo ? 'check' : 'lock'}>
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
        className={activo ? 'bg-surface ring-1 ring-border hover:bg-surface-2' : undefined}
        loading={cambiar.isPending}
        onClick={alternar}
        aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${mecanico.nombre}`}
      >
        {activo ? 'Desactivar' : 'Activar'}
      </Button>
    </div>
  );
}
