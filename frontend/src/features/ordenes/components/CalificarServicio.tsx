import { useState } from 'react';
import { Alert, Badge, Button, Card, Estrellas, Textarea } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { ASPECTOS_RESENA } from '@/lib/resenas';
import { toast } from '@/lib/toast';
import type { OrdenDetalle, Resena } from '@/types';
import { useCalificar } from '../hooks/use-ordenes';

const TEXTO_ESTRELLAS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

/**
 * HU-89 · «Califica tu experiencia» en el seguimiento del cliente, con la orden entregada o
 * cerrada: 1 a 5 estrellas, aspectos rápidos y comentario. Ya enviada, muestra la reseña y la
 * respuesta del taller.
 */
export function CalificarServicio({ orden, taller }: { orden: OrdenDetalle; taller: string }) {
  if (orden.resena) return <MiResena resena={orden.resena} taller={taller} />;
  return <FormularioResena orden={orden} />;
}

function FormularioResena({ orden }: { orden: OrdenDetalle }) {
  const calificar = useCalificar(orden.publicId);
  const [calificacion, setCalificacion] = useState(0);
  const [aspectos, setAspectos] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);

  function alternar(aspecto: string) {
    setAspectos((lista) =>
      lista.includes(aspecto) ? lista.filter((a) => a !== aspecto) : [...lista, aspecto],
    );
  }

  async function enviar() {
    if (calificacion === 0) {
      setError('Elige de 1 a 5 estrellas');
      return;
    }
    setError(null);
    try {
      await calificar.mutateAsync({
        calificacion,
        aspectos,
        comentario: comentario.trim() || undefined,
      });
      toast('¡Gracias por calificar el servicio!', 'success');
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <Card title="Califica tu experiencia">
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-5 text-ink-muted">
          ¿Cómo te fue con la orden #{orden.numero}? Tu opinión ayuda al taller a mejorar.
        </p>
        <div className="flex flex-wrap items-center gap-x-2">
          <Estrellas
            valor={calificacion}
            onChange={setCalificacion}
            size={30}
            className="-ml-2.5"
          />
          {calificacion > 0 && (
            <span className="text-sm font-semibold">{TEXTO_ESTRELLAS[calificacion]}</span>
          )}
        </div>
        <div role="group" aria-label="Lo que más te gustó" className="flex flex-wrap gap-2">
          {ASPECTOS_RESENA.map((a) => {
            const elegido = aspectos.includes(a);
            return (
              <button
                key={a}
                type="button"
                aria-pressed={elegido}
                onClick={() => alternar(a)}
                className={cn(
                  'inline-flex min-h-touch items-center rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150',
                  elegido
                    ? 'border-ink bg-ink text-on-primary'
                    : 'border-border bg-surface text-ink',
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
        <Textarea
          label="Comentario"
          hint="Opcional"
          rows={3}
          maxLength={500}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        {error && <Alert>{error}</Alert>}
        <Button fullWidth icon="send" loading={calificar.isPending} onClick={() => void enviar()}>
          Enviar calificación
        </Button>
      </div>
    </Card>
  );
}

function MiResena({ resena, taller }: { resena: Resena; taller: string }) {
  return (
    <Card title="Tu calificación">
      <div className="flex flex-col gap-3">
        <Estrellas valor={resena.calificacion} size={22} />
        {resena.aspectos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resena.aspectos.map((a) => (
              <Badge key={a}>{a}</Badge>
            ))}
          </div>
        )}
        {resena.comentario && <p className="leading-6">«{resena.comentario}»</p>}
        {resena.respuestaAdmin ? (
          <div className="rounded-[14px] bg-surface-sunken px-3 py-2.5">
            <p className="text-sm font-semibold">Respuesta de {taller}</p>
            <p className="text-sm leading-5">{resena.respuestaAdmin}</p>
            {resena.estado === 'adaptada' && (
              <p className="mt-1.5 text-sm leading-5 text-success-text">
                Tomamos tu opinión como una mejora en el taller.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-5 text-ink-muted">
            ¡Gracias! El taller ya recibió tu opinión.
          </p>
        )}
      </div>
    </Card>
  );
}
