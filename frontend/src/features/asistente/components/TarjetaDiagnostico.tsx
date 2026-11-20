import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import type { DiagnosticoIA } from '@/types';
import { URGENCIA } from '../textos';

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm leading-5 font-semibold text-ink-muted">{titulo}</p>
      {children}
    </div>
  );
}

/**
 * HU-79 · Posible diagnóstico del asistente (DiagnosisCard del prototipo). El cliente ve el
 * consejo; el personal del taller ve las pruebas. Siempre dice que es una sugerencia.
 */
export function TarjetaDiagnostico({
  diagnostico: d,
  personal,
  acciones,
}: {
  diagnostico: DiagnosticoIA;
  /** Mecánico o admin: muestra las pruebas sugeridas en vez del consejo */
  personal: boolean;
  acciones?: ReactNode;
}) {
  const u = URGENCIA[d.urgencia];
  return (
    <section
      aria-label={`Posible diagnóstico: ${d.titulo}`}
      className="flex w-full max-w-[560px] flex-col gap-3 self-start rounded-md border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm leading-5 text-ink-muted">Posible diagnóstico</p>
          <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">{d.titulo}</h2>
        </div>
        <Badge tono={u.tono} icon={u.icon}>
          {u.label}
        </Badge>
      </div>
      <p>{d.resumen}</p>
      <Bloque titulo="Causas más probables">
        <ol className="list-decimal space-y-0.5 pl-5">
          {d.causas.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </Bloque>
      {personal && d.pruebas.length > 0 && (
        <Bloque titulo="Pruebas sugeridas">
          <ul className="list-disc space-y-0.5 pl-5">
            {d.pruebas.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Bloque>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm leading-5">
        <dt className="text-ink-muted">Costo estimado</dt>
        <dd className="font-semibold">{d.costoEstimado}</dd>
        {!personal && (
          <>
            <dt className="text-ink-muted">Mientras tanto</dt>
            <dd>{d.consejo}</dd>
          </>
        )}
      </dl>
      <p className="text-xs leading-4 text-ink-muted">{d.aviso}</p>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </section>
  );
}
