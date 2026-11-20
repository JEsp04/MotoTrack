import { useSearchParams } from 'react-router';
import { Alert, AppBar, Page, SkeletonList } from '@/components/ui';
import { useCita } from '@/features/citas';
import { NuevaOrdenForm } from '@/features/ordenes';
import { parseApiError } from '@/lib/api-error';

/**
 * HU-29 · Recibir una moto: crear una orden de servicio.
 * HU-58 · Con ?cita=<id>, la moto llega a su cita: el formulario arranca con la moto y el motivo.
 */
export default function NuevaOrdenPage() {
  const [params] = useSearchParams();
  const cita = params.get('cita');
  if (cita) return <DesdeCita publicId={cita} />;
  return <NuevaOrdenForm clienteInicial={params.get('cliente') ?? undefined} />;
}

function DesdeCita({ publicId }: { publicId: string }) {
  const cita = useCita(publicId);
  if (cita.isSuccess) return <NuevaOrdenForm key={publicId} cita={cita.data} />;
  return (
    <>
      <AppBar title="Nueva orden" />
      <Page narrow>
        {cita.isPending && <SkeletonList rows={2} />}
        {cita.isError && <Alert>{parseApiError(cita.error).message}</Alert>}
      </Page>
    </>
  );
}
