import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button, ButtonLink, Icon, Input, Note, Select } from '@/components/ui';
import type { SugerenciaCita } from '@/features/citas';
import { useMotos } from '@/features/motos';
import { useMiTaller } from '@/features/taller';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { copiarTexto } from '@/lib/portapapeles';
import { enlaceWhatsApp } from '@/lib/whatsapp';
import type { DiagnosticoIA, MensajeAsistente, Moto, Rol } from '@/types';
import { useConsultarAsistente, useEstadoAsistente } from '../hooks/use-asistente';
import { NO_DISPONIBLE, OTRA_CONSULTA, SINTOMAS } from '../textos';
import { TarjetaDiagnostico } from './TarjetaDiagnostico';

interface Burbuja {
  id: number;
  rol: MensajeAsistente['rol'];
  texto: string;
  opciones?: string[];
  diagnostico?: DiagnosticoIA | null;
  /** Saludos y avisos locales: no se mandan al modelo */
  local?: boolean;
}

let siguienteId = 1;
const burbuja = (b: Omit<Burbuja, 'id'>): Burbuja => ({ id: siguienteId++, ...b });

/** Saludo local (no se manda al modelo). Tras «Hacer otra consulta» solo pregunta qué más nota. */
function introduccion(rol: Rol, nombre: string, otra: boolean, moto?: Moto): Burbuja[] {
  if (otra) {
    return [{ id: -1, rol: 'asistente', texto: '¿Qué más notas en la moto?', local: true }];
  }
  const texto =
    rol !== 'cliente'
      ? 'Describe los síntomas de la moto y te sugiero causas probables y pruebas para confirmar.'
      : `Hola, ${nombre.split(' ')[0] || 'bienvenido'}. Cuéntame qué le pasa a ${moto ? `tu ${moto.marca} ${moto.referencia}` : 'tu moto'} y te doy un posible diagnóstico.`;
  return [
    { id: -2, rol: 'asistente', texto, local: true },
    {
      id: -1,
      rol: 'asistente',
      texto: 'Puedes escribirlo con tus palabras o elegir una opción.',
      local: true,
    },
  ];
}

/** Lo que se le manda al modelo: sin saludos locales y con el diagnóstico resumido */
function aMensajes(lista: Burbuja[]): MensajeAsistente[] {
  return lista
    .filter((b) => !b.local)
    .map((b) => ({
      rol: b.rol,
      texto: b.diagnostico
        ? `${b.texto} Posible diagnóstico: ${b.diagnostico.titulo}. ${b.diagnostico.resumen}`
        : b.texto,
    }));
}

/**
 * HU-79 · Chat del asistente IA (ChatScreen del prototipo). El cliente elige su moto para
 * que use su historial; el personal pregunta sin moto. Muestra el cupo del día.
 */
export function ChatAsistente({ rol, nombre }: { rol: Rol; nombre: string }) {
  const personal = rol !== 'cliente';
  const navigate = useNavigate();
  const estado = useEstadoAsistente();
  const consultar = useConsultarAsistente();
  const motos = useMotos({}, !personal);
  const taller = useMiTaller();
  const listaMotos = personal ? [] : (motos.data?.data ?? []);
  const [motoId, setMotoId] = useState<string>('');
  const moto = listaMotos.find((m) => m.publicId === motoId) ?? listaMotos[0];

  /** Mensajes de la conversación, sin el saludo */
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [otra, setOtra] = useState(false);
  const [texto, setTexto] = useState('');
  const finRef = useRef<HTMLDivElement>(null);

  const intro = introduccion(rol, nombre, otra, moto);
  // Los síntomas rápidos solo se ofrecen antes del primer mensaje
  if (burbujas.length === 0) intro[intro.length - 1]!.opciones = SINTOMAS;
  const visibles = [...intro, ...burbujas];

  useEffect(() => {
    finRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  }, [burbujas.length, consultar.isPending]);

  const sinCupo = estado.data ? estado.data.restantes === 0 : false;
  const apagado = estado.data ? !estado.data.disponible : false;
  const bloqueado = sinCupo || apagado || consultar.isPending;

  function reiniciar() {
    setBurbujas([]);
    setOtra(true);
  }

  function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || bloqueado) return;
    if (limpio === OTRA_CONSULTA) return reiniciar();

    // Las respuestas rápidas de mensajes anteriores ya no se pueden tocar
    const base = [
      ...burbujas.map((b) => ({ ...b, opciones: undefined })),
      burbuja({ rol: 'usuario', texto: limpio }),
    ];
    setBurbujas(base);
    setTexto('');
    consultar.mutate(
      { mensajes: aMensajes(base), motoId: moto?.publicId },
      {
        onSuccess: (r) =>
          setBurbujas((prev) => [
            ...prev,
            burbuja({
              rol: 'asistente',
              texto: r.texto,
              opciones: r.opciones,
              diagnostico: r.diagnostico,
            }),
          ]),
        onError: (error) => {
          const { status, message } = parseApiError(error);
          const aviso = status === null || status >= 500 ? NO_DISPONIBLE : message;
          setBurbujas((prev) => [
            ...prev,
            burbuja({ rol: 'asistente', texto: aviso, local: true }),
          ]);
        },
      },
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  function acciones(d: DiagnosticoIA) {
    if (personal) {
      const texto = [
        `${d.titulo} (sugerido por el asistente IA)`,
        `Causas probables: ${d.causas.join('; ')}`,
        d.pruebas.length ? `Pruebas: ${d.pruebas.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return (
        <Button
          size="sm"
          variant="secondary"
          icon="clipboard"
          onClick={() => void copiarTexto(texto, 'Diagnóstico copiado')}
        >
          Copiar para la orden
        </Button>
      );
    }
    // HU-59 · «Pedir cita» abre la pantalla de la cita con el motivo sugerido
    const sugerencia: SugerenciaCita = { motivo: d.motivoCita, motoId: moto?.publicId };
    const telefono = taller.data?.telefono;
    const deMoto = moto ? ` de mi ${moto.marca} ${moto.referencia} (${moto.placa})` : '';
    const mensaje = `Hola ${taller.data?.nombre ?? ''}, el asistente IA de MotoTrack sugiere revisar${deMoto}: ${d.titulo}. Motivo: ${d.motivoCita}.`;
    return (
      <>
        {telefono && (
          <ButtonLink
            size="sm"
            variant="secondary"
            href={enlaceWhatsApp(telefono, mensaje)}
            externo
            icon="send"
          >
            Enviar al taller
          </ButtonLink>
        )}
        <Button
          size="sm"
          icon="calendar"
          onClick={() => navigate('/cliente/citas/nueva', { state: { sugerencia } })}
        >
          Pedir cita
        </Button>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-form flex-1 flex-col gap-3 px-4 pt-4 pb-4 lg:px-8">
        {listaMotos.length > 1 && (
          <Select
            label="Moto"
            value={moto?.publicId ?? ''}
            onChange={(e) => setMotoId(e.target.value)}
            options={listaMotos.map((m) => ({
              value: m.publicId,
              label: `${m.marca} ${m.referencia} · ${m.placa}`,
            }))}
          />
        )}
        {apagado && (
          <Note tono="accent" icon="info">
            El asistente IA no está activado en este taller todavía.
          </Note>
        )}

        <div
          role="log"
          aria-live="polite"
          aria-label="Conversación"
          className="flex flex-col gap-2"
        >
          {visibles.map((b) => (
            <div key={b.id} className="flex flex-col gap-2">
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-[22px]',
                  b.rol === 'asistente'
                    ? 'self-start rounded-bl-sm bg-surface-sunken'
                    : 'self-end rounded-br-sm bg-ink text-on-primary',
                )}
              >
                {b.texto}
              </div>
              {b.diagnostico && (
                <TarjetaDiagnostico
                  diagnostico={b.diagnostico}
                  personal={personal}
                  acciones={acciones(b.diagnostico)}
                />
              )}
              {b.opciones && b.opciones.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {b.opciones.map((o) => (
                    <button
                      key={o}
                      type="button"
                      disabled={bloqueado && o !== OTRA_CONSULTA}
                      onClick={() => enviar(o)}
                      className="inline-flex min-h-touch items-center rounded-full border border-border bg-surface px-3.5 text-sm font-semibold disabled:opacity-45"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {consultar.isPending && (
            <div
              role="status"
              aria-label="El asistente está escribiendo"
              className="flex gap-1 self-start rounded-2xl rounded-bl-sm bg-surface-sunken px-4 py-3.5"
            >
              {[0, 150, 300].map((ms) => (
                <i
                  key={ms}
                  className="block size-[7px] animate-pulse rounded-full bg-ink-muted motion-reduce:animate-none"
                  style={{ animationDelay: `${ms}ms` }}
                />
              ))}
            </div>
          )}
          <div ref={finRef} />
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="sticky bottom-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom))] z-20 border-t border-border bg-surface px-4 pt-3 pb-3 lg:bottom-0"
      >
        <div className="mx-auto flex w-full max-w-[696px] items-end gap-2">
          <Input
            label="Mensaje para el asistente"
            hideLabel
            className="min-w-0 flex-1"
            placeholder={sinCupo ? 'Sin consultas por hoy' : 'Describe el síntoma…'}
            value={texto}
            maxLength={800}
            disabled={sinCupo || apagado}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Button
            type="submit"
            aria-label="Enviar"
            icon="send"
            disabled={!texto.trim() || bloqueado}
            className="px-4"
          />
        </div>
        {estado.data && estado.data.disponible && (
          <p className="mx-auto mt-1.5 flex max-w-[696px] items-center gap-1 text-xs leading-4 text-ink-muted">
            <Icon name="sparkle" size={14} />
            {sinCupo
              ? 'Ya usaste tus consultas de hoy. Mañana puedes volver a preguntar.'
              : `Te quedan ${estado.data.restantes} de ${estado.data.limite} consultas hoy.`}
          </p>
        )}
      </form>
    </div>
  );
}
