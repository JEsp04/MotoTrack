import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '@/components/ui';
import { hoyColombia } from '@/lib/format';
import { citaActiva } from '../estados';
import { formatDiaCita, partesCita } from '../fechas';
import { useCitas } from '../hooks/use-citas';

/**
 * HU-60 · «Próxima cita» en el inicio del cliente: lleva a «Mis citas».
 * No se muestra si no tiene citas próximas.
 */
export function ProximaCita() {
  const citas = useCitas();
  // La hora de cuando se abre la pantalla
  const [ahora] = useState(() => Date.now());
  const prox = (citas.data?.data ?? []).find(
    (c) => citaActiva(c.estado) && Date.parse(c.fechaHora) >= ahora,
  );
  if (!prox) return null;
  const { dia, hora } = partesCita(prox.fechaHora);

  return (
    <Link
      to="/cliente/citas"
      className="flex w-full items-center gap-3 rounded-md bg-surface-sunken p-4 text-left text-ink transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface text-ink"
      >
        <Icon name="calendar" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-5 text-ink-muted">Próxima cita</span>
        <span className="block font-semibold">
          {formatDiaCita(dia, hoyColombia())} · {hora}
        </span>
        <span className="block truncate text-sm leading-5 text-ink-muted">
          {prox.motivo} · {prox.moto.placa}
        </span>
      </span>
      <Icon name="chevronRight" className="shrink-0 text-ink-muted" />
    </Link>
  );
}
