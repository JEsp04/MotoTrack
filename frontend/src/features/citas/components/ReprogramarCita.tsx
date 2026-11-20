import { Alert, AppBar, ButtonLink, Page, SkeletonList } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { citaActiva } from '../estados';
import { useCita } from '../hooks/use-citas';
import { PedirCita } from './PedirCita';

/** HU-60 · «Reprogramar cita»: la pantalla de HU-59 con los datos de la cita */
export function ReprogramarCita({ publicId }: { publicId: string }) {
  const cita = useCita(publicId);

  if (cita.isSuccess && citaActiva(cita.data.estado)) {
    return <PedirCita key={cita.data.publicId} cita={cita.data} volverA="/cliente/citas" />;
  }

  return (
    <>
      <AppBar title="Reprogramar cita" />
      <Page narrow>
        {cita.isPending && <SkeletonList rows={2} />}
        {cita.isError && <Alert>{parseApiError(cita.error).message}</Alert>}
        {cita.isSuccess && (
          <Alert tono="info">
            Esta cita ya está {cita.data.estado}: no se puede reprogramar. Pide una cita nueva.
          </Alert>
        )}
        <ButtonLink href="/cliente/citas" variant="secondary" fullWidth>
          Ver mis citas
        </ButtonLink>
      </Page>
    </>
  );
}
