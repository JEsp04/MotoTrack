import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { EventoHistorial, Rol } from '@/types';
import { ETIQUETA_ESTADO } from '../textos';

const ROL: Record<Rol, string> = {
  admin: 'Admin',
  mecanico: 'Mecánico',
  cliente: 'Cliente',
};

/** Fecha corta del historial, como en el prototipo: «17 oct · 8:20» */
function fechaCorta(iso: string) {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  })
    .format(d)
    .replace('.', '')
    .replace(' de ', ' ');
  const hora = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  }).format(d);
  return `${dia} · ${hora}`;
}

/**
 * HU-31 · Línea de tiempo de los cambios de estado (del más reciente al más antiguo).
 * La usan el detalle del taller y, desde HU-84, el seguimiento del cliente.
 */
export function HistorialEstados({ historial }: { historial: EventoHistorial[] }) {
  return (
    <Card
      title="Historial de estados"
      action={
        <span className="text-sm text-ink-muted">
          {historial.length} {historial.length === 1 ? 'cambio' : 'cambios'}
        </span>
      }
    >
      <ol className="m-0 list-none p-0" aria-label="Historial de estados">
        {historial.map((h, i) => (
          <li key={`${h.creadoEn}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            <span className="flex w-6 shrink-0 flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  'mt-1.5 size-3 shrink-0 rounded-full',
                  h.estadoNuevo === 'esperando_aprobacion' ? 'bg-accent' : 'bg-ink',
                )}
              />
              {i < historial.length - 1 && <span className="mt-1 w-0.5 flex-1 bg-border" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{ETIQUETA_ESTADO[h.estadoNuevo]}</span>
                <span className="shrink-0 text-sm text-ink-muted">{fechaCorta(h.creadoEn)}</span>
              </div>
              <p className="text-sm leading-5 text-ink-muted">
                {h.usuario.nombre} ({ROL[h.usuario.rol]})
              </p>
              {h.observacion && (
                <p className="mt-1.5 rounded-sm bg-surface px-3 py-2 text-sm leading-5">
                  {h.observacion}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
