import { useMutation } from '@tanstack/react-query';
import { Alert, BottomSheet, Button } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import type { ClaveRestablecida } from '@/types';
import { BotonCopiarMensaje, EnlaceWhatsApp } from './EnlaceWhatsApp';
import { MensajePrevio } from './MensajePrevio';

/** Mensaje para enviarle la clave temporal (sin costo, desde el WhatsApp del admin) */
function mensajeClaveTemporal(r: ClaveRestablecida, taller: string) {
  const nombre = r.nombre.split(' ')[0] || '';
  return (
    `Hola${nombre ? ` ${nombre}` : ''}, restablecimos tu contraseña de MotoTrack en ${taller}.\n` +
    `Tu clave temporal es: ${r.claveTemporal}\n` +
    'Ingresa con ella y cámbiala en «Mi cuenta» → «Cambiar contraseña».'
  );
}

/**
 * HU-86 · «Restablecer contraseña» desde el taller: primero confirma; luego muestra la clave
 * temporal con los botones para enviarla por WhatsApp o copiarla. Sirve para mecánicos
 * (`/admin/equipo`) y clientes con cuenta (`/admin/clientes/:id`).
 */
export function RestablecerClaveSheet({
  open,
  nombre,
  taller,
  restablecer,
  onClose,
}: {
  open: boolean;
  nombre: string;
  taller: string;
  restablecer: () => Promise<ClaveRestablecida>;
  onClose: () => void;
}) {
  const accion = useMutation({ mutationFn: restablecer });
  const resultado = accion.data;

  function cerrar() {
    accion.reset();
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      title={resultado ? 'Clave temporal lista' : 'Restablecer contraseña'}
      onClose={cerrar}
      footer={
        resultado ? (
          <Button fullWidth variant="secondary" onClick={cerrar}>
            Listo
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={cerrar}>
              Cancelar
            </Button>
            <Button variant="danger" loading={accion.isPending} onClick={() => accion.mutate()}>
              Restablecer
            </Button>
          </>
        )
      }
    >
      {accion.isError && <Alert>{parseApiError(accion.error).message}</Alert>}
      {resultado ? (
        <>
          <p>
            Entrégale esta clave a {resultado.nombre}. Con ella vuelve a ingresar y luego la cambia
            en «Mi cuenta».
          </p>
          <p
            className="rounded-md bg-surface-sunken px-4 py-3 text-center font-num text-[26px] tracking-[0.18em]"
            aria-label={`Clave temporal: ${resultado.claveTemporal.split('').join(' ')}`}
          >
            {resultado.claveTemporal}
          </p>
          <MensajePrevio de={taller} texto={mensajeClaveTemporal(resultado, taller)} />
          {resultado.telefono && (
            <EnlaceWhatsApp
              telefono={resultado.telefono}
              texto={mensajeClaveTemporal(resultado, taller)}
              className="w-full"
            />
          )}
          <BotonCopiarMensaje texto={mensajeClaveTemporal(resultado, taller)} className="w-full" />
        </>
      ) : (
        <>
          <p>
            Vamos a crear una clave temporal para <span className="font-semibold">{nombre}</span>.
          </p>
          <p className="text-sm leading-5 text-ink-muted">
            Su contraseña actual deja de funcionar y se cierran sus sesiones abiertas. Le entregas
            la clave por WhatsApp o en persona; no tiene costo.
          </p>
        </>
      )}
    </BottomSheet>
  );
}
