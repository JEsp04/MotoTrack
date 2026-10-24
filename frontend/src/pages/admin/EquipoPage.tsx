import { useState } from 'react';
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
} from '@/components/ui';
import { NuevoMecanicoSheet, useCambiarEstado, useEquipo } from '@/features/equipo';
import { parseApiError } from '@/lib/api-error';
import { formatFecha } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Integrante } from '@/types';

/**
 * HU-23 · Usuarios del taller (UsersScreen del prototipo): el admin y los mecánicos con su rol.
 * El admin crea las cuentas de los mecánicos y los activa o desactiva.
 * Las invitaciones por WhatsApp o correo llegan en la segunda entrega.
 */
export default function EquipoPage() {
  const equipo = useEquipo();
  const [creando, setCreando] = useState(false);
  const [elegido, setElegido] = useState<Integrante | null>(null);
  const usuarios = equipo.data ?? [];
  const mecanicos = usuarios.filter((u) => u.rol === 'mecanico');
  const activos = usuarios.filter((u) => u.estado === 'activo').length;

  return (
    <>
      <AppBar
        title="Usuarios y roles"
        subtitle={
          equipo.isSuccess ? `${activos} ${activos === 1 ? 'activo' : 'activos'}` : undefined
        }
      />
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
                onClick={u.rol === 'mecanico' ? () => setElegido(u) : undefined}
                chevron={false}
                aria-label={u.rol === 'mecanico' ? `Opciones de ${u.nombre}` : undefined}
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
                Todo el taller: órdenes, clientes y motos, y las cuentas de los mecánicos.
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
      <Fab label="Agregar mecánico" onClick={() => setCreando(true)} />

      <NuevoMecanicoSheet open={creando} onClose={() => setCreando(false)} />
      <OpcionesMecanico mecanico={elegido} onClose={() => setElegido(null)} />
    </>
  );
}

/** Hoja con el estado de un mecánico y el botón para activarlo o desactivarlo */
function OpcionesMecanico({
  mecanico,
  onClose,
}: {
  mecanico: Integrante | null;
  onClose: () => void;
}) {
  const cambiar = useCambiarEstado();
  if (!mecanico) return null;
  const activo = mecanico.estado === 'activo';

  async function alternar() {
    if (!mecanico) return;
    try {
      await cambiar.mutateAsync({
        publicId: mecanico.publicId,
        estado: activo ? 'inactivo' : 'activo',
      });
      toast(
        activo
          ? `${mecanico.nombre} ya no puede ingresar. Su historial se conserva.`
          : `${mecanico.nombre} puede ingresar de nuevo`,
        'success',
      );
      onClose();
    } catch (error) {
      toast(parseApiError(error).message, 'danger');
    }
  }

  return (
    <BottomSheet
      open
      title={mecanico.nombre}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button
            variant={activo ? 'danger' : 'primary'}
            loading={cambiar.isPending}
            onClick={alternar}
            aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${mecanico.nombre}`}
          >
            {activo ? 'Desactivar' : 'Activar'}
          </Button>
        </>
      }
    >
      <DataList
        items={[
          ['Rol', 'Mecánico'],
          ['Correo', mecanico.email],
          ['Estado', activo ? 'Activo' : 'Desactivado'],
          [
            'Último ingreso',
            mecanico.ultimoAcceso ? formatFecha(mecanico.ultimoAcceso) : 'Aún no ha ingresado',
          ],
        ]}
      />
      {activo && (
        <p className="text-sm leading-5 text-ink-muted">
          Si lo desactivas, ya no podrá ingresar. Sus órdenes e historial se conservan.
        </p>
      )}
    </BottomSheet>
  );
}
