import { useState } from 'react';
import { Badge, BottomSheet, Button, EmptyState, Icon, type IconName } from '@/components/ui';
import { useSession } from '@/features/auth';
import type { Tono } from '@/lib/estados-orden';
import { parseApiError } from '@/lib/api-error';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { EstadoInvitacion, Invitacion } from '@/types';
import { useCancelarInvitacion, useReenviarInvitacion } from '../hooks/use-invitaciones';
import { EnlaceWhatsApp } from './EnlaceWhatsApp';
import { MensajePrevio } from './MensajePrevio';
import { mensajeInvitacion, ROL_INVITADO } from './mensaje';

/** Chip de cada estado, con los textos y colores del prototipo */
const CHIP: Record<EstadoInvitacion, { label: string; tono: Tono; icon: IconName }> = {
  pendiente: { label: 'Pendiente', tono: 'accent', icon: 'clock' },
  vencida: { label: 'Vencida', tono: 'danger', icon: 'alert' },
  usada: { label: 'Aceptada', tono: 'success', icon: 'check' },
  cancelada: { label: 'Cancelada', tono: 'neutral', icon: 'close' },
};

function detalle(i: Invitacion) {
  const base = `Código ${i.codigo} · enviada por WhatsApp · ${formatFecha(i.actualizadoEn)}`;
  if (i.estado === 'pendiente') return `${base} · vence el ${formatFecha(i.venceEn)}`;
  if (i.estado === 'vencida') return `${base} · venció el ${formatFecha(i.venceEn)}`;
  return base;
}

/** HU-67 · Pestaña «Invitaciones» de Usuarios y roles: reenviar o cancelar las pendientes */
export function InvitacionesLista({ invitaciones }: { invitaciones: Invitacion[] }) {
  const reenviar = useReenviarInvitacion();
  const cancelar = useCancelarInvitacion();
  const [reenviada, setReenviada] = useState<Invitacion | null>(null);

  if (invitaciones.length === 0)
    return (
      <EmptyState
        icon="mail"
        title="Sin invitaciones"
        text="Invita a tus mecánicos para que registren diagnósticos desde su celular."
      />
    );

  async function alReenviar(i: Invitacion) {
    try {
      const nueva = await reenviar.mutateAsync(i.publicId);
      toast(`Invitación reenviada. Vence el ${formatFecha(nueva.venceEn)}.`, 'success');
      setReenviada(nueva);
    } catch (error) {
      toast(parseApiError(error).message, 'danger');
    }
  }

  async function alCancelar(i: Invitacion) {
    try {
      await cancelar.mutateAsync(i.publicId);
      toast('Invitación cancelada. El enlace ya no funciona.');
    } catch (error) {
      toast(parseApiError(error).message, 'danger');
    }
  }

  return (
    <>
      <ul aria-label="Invitaciones" className="flex flex-col gap-4">
        {invitaciones.map((i) => {
          const chip = CHIP[i.estado];
          const abierta = i.estado === 'pendiente' || i.estado === 'vencida';
          return (
            <li key={i.publicId} className="flex flex-col gap-2.5 rounded-md bg-surface-sunken p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{i.nombre}</p>
                  <p className="text-sm leading-5 text-ink-muted">
                    {ROL_INVITADO[i.rol]} · {i.telefono}
                  </p>
                </div>
                <Badge tono={chip.tono} icon={chip.icon}>
                  {chip.label}
                </Badge>
              </div>
              <p className="flex items-start gap-1.5 text-sm leading-5 text-ink-muted">
                <Icon name="message" size={16} className="mt-0.5 shrink-0" />
                {detalle(i)}
              </p>
              {abierta && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="send"
                    onClick={() => void alReenviar(i)}
                    aria-label={`Reenviar la invitación de ${i.nombre}`}
                  >
                    Reenviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger-text"
                    onClick={() => void alCancelar(i)}
                    aria-label={`Cancelar la invitación de ${i.nombre}`}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <MensajeReenviado invitacion={reenviada} onClose={() => setReenviada(null)} />
    </>
  );
}

/** Después de reenviar: el mensaje de nuevo, para mandarlo por WhatsApp */
function MensajeReenviado({
  invitacion,
  onClose,
}: {
  invitacion: Invitacion | null;
  onClose: () => void;
}) {
  const usuario = useSession((s) => s.usuario);
  if (!invitacion) return null;
  const texto = mensajeInvitacion({
    ...invitacion,
    admin: usuario?.nombre ?? '',
    taller: usuario?.taller.nombre ?? '',
  });
  return (
    <BottomSheet
      open
      title="Reenviar invitación"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Listo
          </Button>
          <EnlaceWhatsApp telefono={invitacion.telefono} texto={texto} />
        </>
      }
    >
      <MensajePrevio de={usuario?.taller.nombre ?? ''} texto={texto} />
    </BottomSheet>
  );
}
