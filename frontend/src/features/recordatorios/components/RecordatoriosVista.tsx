import { useState } from 'react';
import {
  Alert,
  AppBar,
  BottomSheet,
  Button,
  ButtonLink,
  EmptyState,
  Icon,
  Page,
  Plate,
  SelectCard,
  SkeletonList,
  Tabs,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { MensajePrevio } from '@/features/equipo';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import { enlaceWhatsApp } from '@/lib/whatsapp';
import type { Recordatorio } from '@/types';
import type { PestanaRecordatorios } from '../api/recordatorios-api';
import {
  useAprobarRecordatorio,
  useRechazarRecordatorio,
  useRecordatorios,
} from '../hooks/use-recordatorios';
import { MOTIVOS_RECHAZO, mensajeRecordatorio } from './textos';

/**
 * HU-75 · «Recordatorios» (AlertsScreen del prototipo, sin IA): pestañas «Por revisar» y
 * «Revisadas». «Aprobar y enviar» abre WhatsApp con el mensaje (HU-68) y deja un aviso al
 * cliente (HU-69); «Rechazar» pide uno de los motivos del prototipo.
 */
export function RecordatoriosVista({ onBack }: { onBack?: () => void }) {
  const [pestana, setPestana] = useState<PestanaRecordatorios>('pendiente');
  const [aprobando, setAprobando] = useState<Recordatorio | null>(null);
  const [rechazando, setRechazando] = useState<Recordatorio | null>(null);
  const [motivo, setMotivo] = useState<string | null>(null);
  const taller = useSession((s) => s.usuario?.taller.nombre ?? '');

  const lista = useRecordatorios(pestana);
  const aprobar = useAprobarRecordatorio();
  const rechazar = useRechazarRecordatorio();
  const items = lista.data?.data ?? [];
  const pendientes = lista.data?.meta.pendientes;

  function enviar(r: Recordatorio) {
    // El enlace de WhatsApp se abre con el mismo toque; aquí se registra la aprobación
    aprobar.mutate(r.publicId, {
      onSuccess: () => toast('Recordatorio aprobado', 'success'),
      onError: (e) => toast(parseApiError(e).message, 'danger'),
    });
    setAprobando(null);
  }

  function confirmarRechazo(r: Recordatorio) {
    if (!motivo) return;
    rechazar.mutate(
      { publicId: r.publicId, motivo },
      {
        onSuccess: () => {
          toast('Recordatorio rechazado. No se envió nada al cliente.');
          setRechazando(null);
        },
        onError: (e) => toast(parseApiError(e).message, 'danger'),
      },
    );
  }

  return (
    <>
      <AppBar title="Recordatorios" subtitle="Mantenimiento preventivo" onBack={onBack} />
      <Tabs
        variant="underline"
        label="Recordatorios"
        value={pestana}
        onChange={setPestana}
        tabs={[
          {
            id: 'pendiente',
            label: pendientes === undefined ? 'Por revisar' : `Por revisar (${pendientes})`,
          },
          { id: 'revisados', label: 'Revisadas' },
        ]}
      />
      <Page narrow>
        {pestana === 'pendiente' && (
          <p className="text-sm leading-5 text-ink-muted">
            MotoTrack revisa la fecha y el kilometraje de la última vez que se hizo cada servicio.
            Al aprobar, el recordatorio le llega al cliente; al rechazar, no se envía nada.
          </p>
        )}

        {lista.isError && (
          <Alert>
            {parseApiError(lista.error).message}{' '}
            <button type="button" className="underline" onClick={() => void lista.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {lista.isPending && <SkeletonList rows={3} />}

        {lista.isSuccess && items.length === 0 && (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="wrench"
              title={pestana === 'pendiente' ? 'Todo al día' : 'Nada revisado aún'}
              text={
                pestana === 'pendiente'
                  ? 'No hay recordatorios pendientes. Te avisaremos cuando una moto se acerque a su mantenimiento.'
                  : 'Aquí verás quién aprobó o rechazó cada recordatorio.'
              }
            />
          </div>
        )}

        {items.length > 0 && (
          <ul aria-label="Recordatorios" className="flex flex-col gap-3">
            {items.map((r) => (
              <li key={r.publicId}>
                <TarjetaRecordatorio
                  r={r}
                  onAprobar={() => setAprobando(r)}
                  onRechazar={() => {
                    setMotivo(null);
                    setRechazando(r);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Page>

      <BottomSheet
        open={Boolean(aprobando)}
        title="Aprobar y enviar"
        onClose={() => setAprobando(null)}
        footer={
          aprobando && (
            <>
              <Button variant="secondary" onClick={() => setAprobando(null)}>
                Cancelar
              </Button>
              <ButtonLink
                href={enlaceWhatsApp(
                  aprobando.moto.cliente.telefono,
                  mensajeRecordatorio(aprobando, taller),
                )}
                externo
                icon="send"
                onClick={() => enviar(aprobando)}
              >
                Enviar
              </ButtonLink>
            </>
          )
        }
      >
        {aprobando && (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-5 text-ink-muted">
              Para {aprobando.moto.cliente.nombre} · {aprobando.moto.marca}{' '}
              {aprobando.moto.referencia} ({aprobando.moto.placa})
            </p>
            <MensajePrevio de={taller} texto={mensajeRecordatorio(aprobando, taller)} />
            <p className="text-sm leading-5 text-ink-muted">
              {aprobando.moto.cliente.tieneCuenta
                ? 'También le llega como aviso en la app.'
                : 'El cliente no tiene cuenta: solo le llega por WhatsApp.'}
            </p>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={Boolean(rechazando)}
        title="Rechazar recordatorio"
        onClose={() => setRechazando(null)}
        footer={
          rechazando && (
            <>
              <Button variant="secondary" onClick={() => setRechazando(null)}>
                Volver
              </Button>
              <Button
                variant="danger"
                disabled={!motivo}
                loading={rechazar.isPending}
                onClick={() => confirmarRechazo(rechazando)}
              >
                Rechazar
              </Button>
            </>
          )
        }
      >
        {rechazando && (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-5 text-ink-muted">
              {rechazando.titulo} · {rechazando.moto.cliente.nombre}. No se enviará nada al cliente.
            </p>
            <p id="motivo-recordatorio" className="text-sm font-semibold">
              ¿Por qué lo rechazas? <span className="text-danger-text">*</span>
            </p>
            <div
              role="radiogroup"
              aria-labelledby="motivo-recordatorio"
              className="flex flex-col gap-2"
            >
              {MOTIVOS_RECHAZO.map((m) => (
                <SelectCard
                  key={m}
                  checked={motivo === m}
                  onSelect={() => setMotivo(m)}
                  className="py-2.5"
                >
                  {m}
                </SelectCard>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

/** Tarjeta de un recordatorio (AIRecommendationCard del prototipo, sin IA ni «confianza») */
function TarjetaRecordatorio({
  r,
  onAprobar,
  onRechazar,
}: {
  r: Recordatorio;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const aprobado = r.estado === 'aprobado';
  return (
    <article className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-primary text-accent"
        >
          <Icon name="wrench" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{r.titulo}</h2>
          <p className="truncate text-sm leading-5 text-ink-muted">
            {r.moto.cliente.nombre} · {r.moto.marca} {r.moto.referencia}
          </p>
        </div>
        <Plate placa={r.moto.placa} />
      </div>
      <p className="rounded-[14px] bg-bg px-3 py-2 text-sm leading-5 text-ink-muted">
        <strong className="font-semibold text-ink">Por qué: </strong>
        {r.porQue}
      </p>
      {r.ultimoServicio.fechaEntrega && (
        <p className="flex items-center gap-1.5 text-sm leading-5 text-ink-muted">
          <Icon name="clock" size={16} />
          Último servicio: {formatFecha(r.ultimoServicio.fechaEntrega)} · orden #
          {r.ultimoServicio.numero}
        </p>
      )}

      {r.estado === 'pendiente' ? (
        <div className="flex gap-2 *:flex-1">
          <Button variant="secondary" size="sm" icon="close" onClick={onRechazar}>
            Rechazar
          </Button>
          <Button size="sm" icon="send" onClick={onAprobar}>
            Aprobar y enviar
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-sm px-3 py-2.5 text-sm leading-5',
            aprobado ? 'bg-success-soft' : 'bg-bg',
          )}
        >
          <span className={cn('mt-0.5', aprobado ? 'text-success-text' : 'text-danger-text')}>
            <Icon name={aprobado ? 'check' : 'close'} size={16} stroke={2.6} />
          </span>
          <div>
            <p className="font-semibold">
              {aprobado
                ? 'Aprobado · enviado por WhatsApp'
                : `Rechazado${r.motivo ? `: ${r.motivo}` : ''}`}
            </p>
            <p className="text-ink-muted">
              {r.revisadoPor ? `Por ${r.revisadoPor.nombre} · ` : ''}
              {r.revisadoEn ? formatFecha(r.revisadoEn) : ''}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
