import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  BottomSheet,
  Button,
  ButtonLink,
  EmptyState,
  Fab,
  HoldButton,
  Page,
  Plate,
  SkeletonList,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { useMiTaller } from '@/features/taller';
import { parseApiError } from '@/lib/api-error';
import { hoyColombia } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Cita } from '@/types';
import { citaActiva, ESTADO_CITA } from '../estados';
import { formatDiaCita, partesCita } from '../fechas';
import { useActualizarCita, useCitas } from '../hooks/use-citas';

const cuando = (c: Cita, hoy: string) => {
  const { dia, hora } = partesCita(c.fechaHora);
  return { dia: formatDiaCita(dia, hoy), hora };
};

/**
 * HU-60 · «Mis citas» del cliente (ClientAppointmentsScreen del prototipo): próximas y
 * anteriores con su estado. Las activas se reprograman o se cancelan (con mantener presionado).
 */
export function MisCitas() {
  const navigate = useNavigate();
  const citas = useCitas();
  const taller = useMiTaller();
  const nombreTaller = useSession((s) => s.usuario?.taller.nombre ?? '');
  const [porCancelar, setPorCancelar] = useState<Cita | null>(null);
  const hoy = hoyColombia();
  // La hora de cuando se abre la pantalla
  const [ahora] = useState(() => Date.now());

  // Próximas: programadas o confirmadas que aún no pasan. El resto va en «Anteriores».
  const todas = citas.data?.data ?? [];
  const esProxima = (c: Cita) => citaActiva(c.estado) && Date.parse(c.fechaHora) >= ahora;
  const proximas = todas.filter(esProxima);
  // Las anteriores, de la más reciente a la más antigua
  const anteriores = todas.filter((c) => !esProxima(c)).reverse();
  const lugar = [nombreTaller, taller.data?.direccion].filter(Boolean).join(' · ');
  const tarjeta = (c: Cita) => (
    <TarjetaCita
      key={c.publicId}
      c={c}
      hoy={hoy}
      lugar={lugar}
      editable={esProxima(c)}
      onCancelar={setPorCancelar}
    />
  );
  return (
    <>
      <AppBar
        title="Mis citas"
        subtitle={
          citas.isSuccess
            ? proximas.length
              ? `${proximas.length} ${proximas.length === 1 ? 'próxima' : 'próximas'}`
              : 'Sin citas próximas'
            : undefined
        }
      />
      <Page pb="fab">
        {citas.isPending && <SkeletonList rows={2} />}
        {citas.isError && (
          <Alert>
            {parseApiError(citas.error).message}{' '}
            <button type="button" className="underline" onClick={() => void citas.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {citas.isSuccess &&
          (proximas.length ? (
            <div className="flex flex-col gap-3">{proximas.map(tarjeta)}</div>
          ) : (
            <div className="rounded-md bg-surface-sunken">
              <EmptyState
                icon="calendar"
                title="No tienes citas"
                text="Elige día y hora, y el taller te espera. Te recordamos un día antes por WhatsApp."
                action={
                  <ButtonLink href="/cliente/citas/nueva" icon="plus">
                    Pedir cita
                  </ButtonLink>
                }
              />
            </div>
          ))}
        {anteriores.length > 0 && (
          <>
            <h2 className="text-lg leading-6 font-semibold">Anteriores</h2>
            <div className="flex flex-col gap-3">{anteriores.map(tarjeta)}</div>
          </>
        )}
      </Page>
      {proximas.length > 0 && (
        <Fab label="Pedir cita" onClick={() => navigate('/cliente/citas/nueva')} />
      )}
      <CancelarCitaSheet cita={porCancelar} hoy={hoy} onClose={() => setPorCancelar(null)} />
    </>
  );
}

/** Una cita: día y hora, taller, estado, moto y motivo. Las activas traen sus botones. */
function TarjetaCita({
  c,
  hoy,
  lugar,
  editable,
  onCancelar,
}: {
  c: Cita;
  hoy: string;
  lugar: string;
  /** Solo las próximas se reprograman o cancelan */
  editable: boolean;
  onCancelar: (c: Cita) => void;
}) {
  const { dia, hora } = cuando(c, hoy);
  const estado = ESTADO_CITA[c.estado];
  return (
    <article className="flex flex-col gap-2.5 rounded-md bg-surface-sunken p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-6 font-semibold tracking-[-0.02em]">
            {dia} · {hora}
          </h3>
          {lugar && <p className="text-sm leading-5 text-ink-muted">{lugar}</p>}
        </div>
        <Badge tono={estado.tono} className="shrink-0">
          {estado.label}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Plate placa={c.moto.placa} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{c.motivo}</p>
          <p className="truncate text-sm leading-5 text-ink-muted">
            {c.moto.marca} {c.moto.referencia}
          </p>
        </div>
      </div>
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink
            href={`/cliente/citas/${c.publicId}/reprogramar`}
            size="sm"
            variant="secondary"
            icon="calendar"
          >
            Reprogramar
          </ButtonLink>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger-text"
            onClick={() => onCancelar(c)}
          >
            Cancelar cita
          </Button>
        </div>
      )}
    </article>
  );
}

/** «¿Cancelar la cita?» con mantener presionado. El taller libera ese horario. */
function CancelarCitaSheet({
  cita,
  hoy,
  onClose,
}: {
  cita: Cita | null;
  hoy: string;
  onClose: () => void;
}) {
  const actualizar = useActualizarCita();
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    setError(null);
    onClose();
  };

  async function cancelar() {
    if (!cita) return;
    setError(null);
    try {
      await actualizar.mutateAsync({ publicId: cita.publicId, body: { estado: 'cancelada' } });
      toast('Cita cancelada', 'success');
      cerrar();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  const c = cita && cuando(cita, hoy);
  return (
    <BottomSheet
      open={Boolean(cita)}
      title="¿Cancelar la cita?"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Volver
          </Button>
          <HoldButton
            label="Mantén para cancelar"
            doneLabel="Suelta para cancelar"
            variant="danger"
            loading={actualizar.isPending}
            onConfirm={() => void cancelar()}
          />
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      {cita && c && (
        <p>
          {c.dia} a las {c.hora} · {cita.motivo}. El taller libera ese horario.
        </p>
      )}
    </BottomSheet>
  );
}
