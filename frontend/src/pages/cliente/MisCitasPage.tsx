import { ButtonLink } from '@/components/ui';
import { Proximamente } from '@/pages/Proximamente';

/** «Mis citas» del cliente. Provisional hasta HU-60 (ver, reprogramar y cancelar). */
export default function MisCitasPage() {
  return (
    <Proximamente
      title="Mis citas"
      hu="HU-60"
      icon="calendar"
      text="Aquí verás tus citas próximas y anteriores"
      actions={
        <ButtonLink href="/cliente/citas/nueva" size="sm" icon="plus">
          Pedir cita
        </ButtonLink>
      }
    />
  );
}
