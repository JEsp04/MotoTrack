import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Recorrido de 6 pasos (StateStepper del prototipo).
 * `actual` va de 0 a 5; 6 = todo completo. `alerta` pinta el paso actual en rojo (falta repuesto).
 * En celular muestra «Paso N de 6 · …» debajo; desde 768 px, el nombre bajo cada paso.
 */
export function Stepper({
  pasos,
  actual,
  alerta = false,
}: {
  pasos: string[];
  actual: number;
  alerta?: boolean;
}) {
  const ultimo = pasos.length - 1;
  const cur = Math.min(actual, ultimo);
  return (
    <div>
      <ol className="m-0 flex list-none p-0" aria-label="Progreso de la orden">
        {pasos.map((paso, i) => {
          const hecho = i < actual || actual > ultimo;
          const esActual = i === actual;
          const final = i === ultimo && actual >= ultimo;
          return (
            <li
              key={paso}
              aria-current={esActual ? 'step' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1.5 text-center text-[11px] leading-[14px] font-semibold text-ink-muted',
                esActual && 'text-ink',
              )}
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[11px] right-1/2 -left-1/2 h-[3px]',
                    hecho || esActual ? 'bg-ink' : 'bg-border',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-6 items-center justify-center rounded-full border-2',
                  final
                    ? 'border-success bg-success text-on-primary'
                    : hecho
                      ? 'border-ink bg-ink text-on-primary'
                      : esActual
                        ? alerta
                          ? 'border-danger bg-danger-soft ring-[5px] ring-danger-soft'
                          : 'border-ink bg-accent ring-[5px] ring-accent-soft'
                        : 'border-border-strong bg-surface',
                )}
              >
                {(hecho || final) && <Icon name="check" size={14} stroke={3} />}
                {esActual && !final && (
                  <span className={cn('size-2 rounded-full', alerta ? 'bg-danger' : 'bg-ink')} />
                )}
              </span>
              <span className="hidden md:block">{paso}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm leading-5 md:hidden">
        <span className="font-semibold">
          {actual > ultimo ? 'Completada' : `Paso ${cur + 1} de ${pasos.length} · ${pasos[cur]}`}
        </span>
        {actual < ultimo && <span className="text-ink-muted">Sigue: {pasos[actual + 1]}</span>}
      </div>
    </div>
  );
}
