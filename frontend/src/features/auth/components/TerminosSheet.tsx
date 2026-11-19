import { BottomSheet, Button } from '@/components/ui';

/**
 * HU-83 · Hoja informativa con los términos de uso y tratamiento de datos personales
 * (Ley 1581 de 2012) para quienes crean cuenta en MotoTrack.
 */
export function TerminosSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet
      open={open}
      title="Términos y tratamiento de datos"
      onClose={onClose}
      footer={
        <Button fullWidth onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <div className="flex flex-col gap-3 text-sm leading-5 text-ink-muted">
        <p className="text-ink">
          Al registrarte en <b>MotoTrack</b> autorizas al taller y a la plataforma a gestionar los
          datos necesarios para el seguimiento de tus motocicletas y órdenes de servicio.
        </p>
        <div>
          <p className="font-semibold text-ink">1. Uso de la cuenta</p>
          <p>
            Tu acceso es personal. Los mecánicos y administradores actúan en nombre del taller que
            los invitó; los clientes aprueban o rechazan cotizaciones bajo su cuenta.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">2. Protección de datos (Ley 1581 de 2012)</p>
          <p>
            Nombre, celular, correo, documento y placas se usan únicamente para identificar
            vehículos, mostrar diagnósticos, cotizaciones y avisos del taller. Puedes solicitar su
            actualización o corrección al administrador del taller.
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}
