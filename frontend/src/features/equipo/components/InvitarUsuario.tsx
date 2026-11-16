import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ActionBar, Alert, AppBar, Button, Input, Note, Page } from '@/components/ui';
import { useSession } from '@/features/auth';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { Invitacion } from '@/types';
import { useCrearInvitacion } from '../hooks/use-invitaciones';
import { invitacionSchema, type InvitacionValues } from '../schemas/invitacion-schema';
import { EnlaceWhatsApp } from './EnlaceWhatsApp';
import { MensajePrevio } from './MensajePrevio';
import { mensajeInvitacion } from './mensaje';
import { OpcionRol } from './OpcionRol';

const FORM_ID = 'invitar-usuario';
/** Mientras no se envía, el código aún no existe: el backend lo crea */
const SIN_CODIGO = '····';

/**
 * HU-67 · «Invitar usuario» (InviteScreen del prototipo). Al enviar, el backend crea el código
 * y la pantalla muestra el mensaje con el enlace `wa.me` listo para mandarlo sin costo.
 */
export function InvitarUsuario() {
  const navigate = useNavigate();
  const [enviada, setEnviada] = useState<Invitacion | null>(null);
  const volver = () => void navigate('/admin/equipo?tab=invitaciones');

  return enviada ? (
    <InvitacionLista invitacion={enviada} onListo={volver} />
  ) : (
    <Formulario onEnviada={setEnviada} onVolver={() => void navigate(-1)} />
  );
}

function useDatosMensaje() {
  const usuario = useSession((s) => s.usuario);
  return { admin: usuario?.nombre ?? '', taller: usuario?.taller.nombre ?? 'tu taller' };
}

function Formulario({
  onEnviada,
  onVolver,
}: {
  onEnviada: (i: Invitacion) => void;
  onVolver: () => void;
}) {
  const crear = useCrearInvitacion();
  const datos = useDatosMensaje();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InvitacionValues>({
    resolver: zodResolver(invitacionSchema),
    mode: 'onTouched',
    defaultValues: { nombre: '', telefono: '', email: '', rol: 'mecanico' },
  });
  const [nombre, rol] = useWatch({ control, name: ['nombre', 'rol'] });

  const onSubmit = handleSubmit(async (v) => {
    setErrorGeneral(null);
    try {
      const invitacion = await crear.mutateAsync({
        nombre: v.nombre,
        telefono: v.telefono,
        email: v.email || undefined,
        rol: v.rol,
      });
      onEnviada(invitacion);
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <>
      <AppBar title="Invitar usuario" subtitle={datos.taller} onBack={onVolver} />
      <Page narrow pb="actionbar">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {errorGeneral && <Alert>{errorGeneral}</Alert>}
          <Input
            label="Nombre"
            required
            autoComplete="off"
            error={errors.nombre?.message}
            maxLength={LIMITES.nombre}
            {...register('nombre')}
          />
          <Input
            label="Celular"
            type="tel"
            inputMode="tel"
            required
            hint="Con este número verifica su cuenta."
            error={errors.telefono?.message}
            maxLength={LIMITES.telefono}
            {...register('telefono')}
          />
          <Input
            label="Correo (opcional)"
            type="email"
            inputMode="email"
            placeholder="nombre@correo.com"
            error={errors.email?.message}
            maxLength={LIMITES.email}
            {...register('email')}
          />
          <Controller
            control={control}
            name="rol"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Rol" className="flex flex-col gap-2">
                <p className="text-sm leading-5 font-semibold">Rol</p>
                <OpcionRol
                  rol="mecanico"
                  checked={field.value === 'mecanico'}
                  onSelect={() => field.onChange('mecanico')}
                />
                <OpcionRol
                  rol="admin"
                  checked={field.value === 'admin'}
                  onSelect={() => field.onChange('admin')}
                />
              </div>
            )}
          />
          <MensajePrevio
            de={datos.taller}
            texto={mensajeInvitacion({ ...datos, nombre, rol, codigo: SIN_CODIGO })}
          />
          <p className="text-sm leading-5 text-ink-muted">
            Los clientes no se invitan: se registran solos con su celular, o los registras tú en
            Clientes.
          </p>
        </form>
      </Page>
      <ActionBar>
        <Button type="submit" form={FORM_ID} fullWidth icon="send" loading={crear.isPending}>
          Enviar invitación
        </Button>
      </ActionBar>
    </>
  );
}

/** Después de crearla: el código, el mensaje y el botón que abre WhatsApp */
function InvitacionLista({ invitacion, onListo }: { invitacion: Invitacion; onListo: () => void }) {
  const datos = useDatosMensaje();
  const texto = mensajeInvitacion({ ...datos, ...invitacion });
  return (
    <>
      <AppBar title="Invitación lista" subtitle={invitacion.nombre} onBack={onListo} />
      <Page narrow pb="actionbar">
        <Note icon="check">
          Código <b className="font-num">{invitacion.codigo}</b> para {invitacion.nombre}. Vence el{' '}
          {formatFecha(invitacion.venceEn)}. Envíale el mensaje desde tu WhatsApp; no tiene costo.
        </Note>
        <MensajePrevio de={datos.taller} texto={texto} />
      </Page>
      <ActionBar columna>
        <EnlaceWhatsApp telefono={invitacion.telefono} texto={texto} />
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            toast(`Invitación creada para ${invitacion.nombre}`, 'success');
            onListo();
          }}
        >
          Ver invitaciones
        </Button>
      </ActionBar>
    </>
  );
}
