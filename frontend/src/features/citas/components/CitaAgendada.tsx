import { Alert, ButtonLink, DataList, Icon, SkeletonList } from '@/components/ui';
import { useSession } from '@/features/auth';
import { useMiTaller } from '@/features/taller';
import { parseApiError } from '@/lib/api-error';
import { hoyColombia } from '@/lib/format';
import { formatDiaCita, partesCita } from '../fechas';
import { useCita } from '../hooks/use-citas';

/**
 * HU-59 · «Cita agendada» (BookingDoneScreen del prototipo): confirma lo que se pidió y lleva
 * a «Ver mis citas» o «Volver al inicio».
 */
export function CitaAgendada({
  publicId,
  reprogramada = false,
}: {
  publicId: string;
  /** HU-60 · Viene de «Reprogramar cita» */
  reprogramada?: boolean;
}) {
  const cita = useCita(publicId);
  const taller = useMiTaller();
  const nombreTaller = useSession((s) => s.usuario?.taller.nombre);

  if (cita.isPending) {
    return (
      <div className="mx-auto w-full max-w-form p-6">
        <SkeletonList rows={1} />
      </div>
    );
  }
  if (cita.isError) {
    return (
      <div className="mx-auto w-full max-w-form p-6">
        <Alert>{parseApiError(cita.error).message}</Alert>
      </div>
    );
  }

  const c = cita.data;
  const { dia, hora } = partesCita(c.fechaHora);
  const direccion = taller.data?.direccion;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-form flex-col justify-center gap-6 bg-bg px-6 pt-8 pb-6">
      <span
        aria-hidden="true"
        className="flex size-[72px] items-center justify-center rounded-full bg-ink text-accent"
      >
        <Icon name="calendar" size={32} />
      </span>
      <div>
        <h1 className="text-[26px] leading-7 font-semibold tracking-[-0.03em]">
          {reprogramada ? 'Cita reprogramada' : 'Cita agendada'}
        </h1>
        <p className="mt-1.5 text-sm leading-5 text-ink-muted">
          Te esperamos.{c.recordatorio ? ' Te recordamos un día antes por WhatsApp.' : ''}
        </p>
      </div>
      <div className="rounded-md bg-surface-sunken p-4">
        <DataList
          items={[
            ['Cuándo', `${formatDiaCita(dia, hoyColombia())} · ${hora}`],
            ['Moto', `${c.moto.marca} ${c.moto.referencia} · ${c.moto.placa}`],
            ['Motivo', c.motivo],
            c.detalle ? ['Detalle', c.detalle] : null,
            ['Taller', nombreTaller],
            direccion ? ['Dirección', direccion] : null,
          ]}
        />
      </div>
      <p className="text-sm leading-5 text-ink-muted">
        Si no puedes ir, reprograma o cancela desde Mis citas para liberar el horario.
      </p>
      <div className="flex flex-col gap-3">
        <ButtonLink href="/cliente/citas" fullWidth>
          Ver mis citas
        </ButtonLink>
        <ButtonLink href="/cliente" variant="secondary" fullWidth>
          Volver al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
