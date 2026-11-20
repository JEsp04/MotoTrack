import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  BottomSheet,
  Button,
  Card,
  DataList,
  EmptyState,
  Fab,
  List,
  ListItem,
  Page,
  SkeletonList,
  Tabs,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import {
  EditarIntegranteSheet,
  equipoApi,
  InvitacionesLista,
  NuevoMecanicoSheet,
  RestablecerClaveSheet,
  useCambiarEstado,
  useEquipo,
  useInvitaciones,
} from '@/features/equipo';
import { parseApiError } from '@/lib/api-error';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Integrante } from '@/types';

type Pestana = 'activos' | 'invitaciones';

/**
 * HU-23 y HU-67 · Usuarios del taller (UsersScreen del prototipo): el admin y los mecánicos con
 * su rol, y las invitaciones con su código. El admin activa o desactiva a los mecánicos,
 * invita con «Invitar» y reenvía o cancela las invitaciones pendientes.
 */
export default function EquipoPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Pestana = params.get('tab') === 'invitaciones' ? 'invitaciones' : 'activos';
  const equipo = useEquipo();
  const invitaciones = useInvitaciones();
  const [creando, setCreando] = useState(false);
  const [elegido, setElegido] = useState<Integrante | null>(null);
  // Sus propios datos los cambia en «Mi cuenta» (HU-86), no aquí
  const yo = useSession((s) => s.usuario?.publicId);
  const usuarios = equipo.data ?? [];
  const mecanicos = usuarios.filter((u) => u.rol === 'mecanico');
  const activos = usuarios.filter((u) => u.estado === 'activo').length;
  const pendientes = (invitaciones.data ?? []).filter((i) => i.estado === 'pendiente').length;

  return (
    <>
      <AppBar
        title="Usuarios y roles"
        subtitle={
          equipo.isSuccess
            ? `${activos} ${activos === 1 ? 'activo' : 'activos'} · ${pendientes} ${
                pendientes === 1 ? 'invitación pendiente' : 'invitaciones pendientes'
              }`
            : undefined
        }
      />
      <Tabs
        label="Usuarios e invitaciones"
        variant="underline"
        value={tab}
        onChange={(t) => setParams(t === 'invitaciones' ? { tab: t } : {}, { replace: true })}
        tabs={[
          { id: 'activos', label: `Activos (${activos})` },
          { id: 'invitaciones', label: `Invitaciones (${pendientes})` },
        ]}
      />
      {tab === 'invitaciones' ? (
        <Page pb="fab">
          {invitaciones.isPending && <SkeletonList rows={2} />}
          {invitaciones.isError && <Alert>{parseApiError(invitaciones.error).message}</Alert>}
          {invitaciones.isSuccess && <InvitacionesLista invitaciones={invitaciones.data} />}
        </Page>
      ) : (
        <Page pb="fab">
          {equipo.isPending && <SkeletonList rows={3} />}
          {equipo.isError && (
            <Alert>
              {parseApiError(equipo.error).message}{' '}
              <button type="button" className="underline" onClick={() => equipo.refetch()}>
                Intentar de nuevo
              </button>
            </Alert>
          )}
          {equipo.isSuccess && mecanicos.length === 0 && (
            <div className="rounded-md bg-surface-sunken">
              <EmptyState
                icon="team"
                title="Aún no tienes mecánicos"
                text="Crea la cuenta de cada mecánico para asignarle órdenes."
                action={
                  <Button icon="plus" onClick={() => setCreando(true)}>
                    Agregar mecánico
                  </Button>
                }
              />
            </div>
          )}
          {usuarios.length > 0 && (
            <List label="Usuarios">
              {usuarios.map((u) => (
                <ListItem
                  key={u.publicId}
                  initials={u.nombre}
                  title={u.nombre}
                  subtitle={u.email}
                  onClick={u.publicId !== yo ? () => setElegido(u) : undefined}
                  chevron={false}
                  aria-label={u.publicId !== yo ? `Opciones de ${u.nombre}` : undefined}
                  trailing={
                    u.estado === 'inactivo' ? (
                      <Badge icon="lock">Desactivado</Badge>
                    ) : u.rol === 'admin' ? (
                      <Badge tono="ink" icon="settings">
                        Administrador
                      </Badge>
                    ) : (
                      <Badge icon="wrench" className="bg-transparent">
                        Mecánico
                      </Badge>
                    )
                  }
                />
              ))}
            </List>
          )}
          <Card title="Qué puede hacer cada rol">
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="font-semibold">Administrador</p>
                <p className="text-sm leading-5 text-ink-muted">
                  Todo el taller: órdenes, clientes y motos, y los usuarios.
                </p>
              </div>
              <div>
                <p className="font-semibold">Mecánico</p>
                <p className="text-sm leading-5 text-ink-muted">
                  Sus órdenes asignadas, diagnóstico y cambios de estado.
                </p>
              </div>
              <div>
                <p className="font-semibold">Cliente</p>
                <p className="text-sm leading-5 text-ink-muted">
                  No se crea aquí: abre su cuenta en MotoTrack y ve sus motos y cotizaciones.
                </p>
              </div>
            </div>
          </Card>
        </Page>
      )}
      <Fab label="Invitar" onClick={() => void navigate('/admin/equipo/invitar')} />

      <NuevoMecanicoSheet open={creando} onClose={() => setCreando(false)} />
      <OpcionesIntegrante integrante={elegido} onClose={() => setElegido(null)} />
    </>
  );
}

/**
 * Hoja con los datos de alguien del equipo y el botón para activarlo o desactivarlo.
 * HU-86: si está activo, también se le puede restablecer la contraseña (clave temporal).
 * HU-87: «Editar datos» corrige nombre, celular y rol.
 */
function OpcionesIntegrante({
  integrante,
  onClose,
}: {
  integrante: Integrante | null;
  onClose: () => void;
}) {
  const cambiar = useCambiarEstado();
  const taller = useSession((s) => s.usuario?.taller.nombre) ?? 'el taller';
  const [paso, setPaso] = useState<'opciones' | 'editar' | 'clave'>('opciones');
  if (!integrante) return null;
  const activo = integrante.estado === 'activo';
  const rol = integrante.rol === 'admin' ? 'Administrador' : 'Mecánico';

  function cerrar() {
    setPaso('opciones');
    onClose();
  }

  if (paso === 'clave') {
    return (
      <RestablecerClaveSheet
        open
        nombre={integrante.nombre}
        taller={taller}
        restablecer={() => equipoApi.restablecerClave(integrante.publicId)}
        onClose={cerrar}
      />
    );
  }

  if (paso === 'editar') return <EditarIntegranteSheet integrante={integrante} onClose={cerrar} />;

  async function alternar() {
    if (!integrante) return;
    try {
      await cambiar.mutateAsync({
        publicId: integrante.publicId,
        estado: activo ? 'inactivo' : 'activo',
      });
      toast(
        activo
          ? `${integrante.nombre} ya no puede ingresar. Su historial se conserva.`
          : `${integrante.nombre} puede ingresar de nuevo`,
        'success',
      );
      cerrar();
    } catch (error) {
      toast(parseApiError(error).message, 'danger');
    }
  }

  return (
    <BottomSheet
      open
      title={integrante.nombre}
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Volver
          </Button>
          <Button
            variant={activo ? 'danger' : 'primary'}
            loading={cambiar.isPending}
            onClick={alternar}
            aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${integrante.nombre}`}
          >
            {activo ? 'Desactivar' : 'Activar'}
          </Button>
        </>
      }
    >
      <DataList
        items={[
          ['Rol', rol],
          ['Correo', integrante.email],
          ['Celular', integrante.telefono ?? 'Sin celular'],
          ['Estado', activo ? 'Activo' : 'Desactivado'],
          [
            'Último ingreso',
            integrante.ultimoAcceso ? formatFecha(integrante.ultimoAcceso) : 'Aún no ha ingresado',
          ],
        ]}
      />
      {activo && (
        <p className="text-sm leading-5 text-ink-muted">
          Si lo desactivas, ya no podrá ingresar. Sus órdenes e historial se conservan.
        </p>
      )}
      <Button variant="secondary" icon="edit" onClick={() => setPaso('editar')}>
        Editar datos
      </Button>
      {activo && (
        <Button variant="secondary" icon="lock" onClick={() => setPaso('clave')}>
          Restablecer contraseña
        </Button>
      )}
    </BottomSheet>
  );
}
