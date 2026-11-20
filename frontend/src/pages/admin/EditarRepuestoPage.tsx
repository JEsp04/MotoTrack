import { useNavigate, useParams } from 'react-router';
import { Alert, AppBar, Page, SkeletonList } from '@/components/ui';
import { NuevoRepuestoForm, useRepuesto } from '@/features/repuestos';
import { parseApiError } from '@/lib/api-error';

/** HU-87 · «Editar repuesto» (solo admin): el formulario de HU-55 con los datos guardados. */
export default function EditarRepuestoPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const repuesto = useRepuesto(id);

  if (repuesto.data) return <NuevoRepuestoForm key={id} repuesto={repuesto.data} />;
  return (
    <>
      <AppBar title="Editar repuesto" subtitle="Inventario" onBack={() => void navigate(-1)} />
      <Page narrow>
        {repuesto.isError ? (
          <Alert>{parseApiError(repuesto.error).message}</Alert>
        ) : (
          <SkeletonList rows={4} />
        )}
      </Page>
    </>
  );
}
