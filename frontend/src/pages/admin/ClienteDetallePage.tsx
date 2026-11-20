import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Alert,
  AppBar,
  Button,
  ButtonLink,
  Card,
  DataList,
  EmptyState,
  Icon,
  IconButton,
  List,
  ListItem,
  Page,
  Plate,
  Skeleton,
  SkeletonList,
  StatusBadge,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { ClienteSheet, clientesApi, useCliente } from '@/features/clientes';
import { RestablecerClaveSheet } from '@/features/equipo';
import { MotoSheet } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
import { enlaceTelefono, enlaceWhatsApp } from '@/lib/whatsapp';
import type { Moto } from '@/types';

/** HU-25 · Detalle de un cliente: datos, motos (HU-26) y órdenes. */
export default function ClienteDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const cliente = useCliente(id);
  const taller = useSession((s) => s.usuario?.taller.nombre) ?? 'el taller';
  const [editando, setEditando] = useState(false);
  const [restableciendo, setRestableciendo] = useState(false);
  const [motoSheet, setMotoSheet] = useState<{ open: boolean; moto: Moto | null }>({
    open: false,
    moto: null,
  });
  const volver = () => navigate(-1);

  if (cliente.isPending) {
    return (
      <>
        <AppBar title="Cliente" onBack={volver} />
        <div
          className="mx-auto flex w-full max-w-300 flex-col gap-4 p-4 lg:p-8"
          role="status"
          aria-label="Cargando"
        >
          <Skeleton className="h-28 w-full" />
          <SkeletonList rows={2} />
        </div>
      </>
    );
  }

  if (cliente.isError) {
    const e = parseApiError(cliente.error);
    return (
      <>
        <AppBar title="Cliente" onBack={volver} />
        <div className="mx-auto w-full max-w-300 p-4 lg:p-8">
          {e.status === 404 ? (
            <EmptyState
              icon="users"
              title="No encontramos este cliente"
              text="Puede que sea de otro taller o que la dirección esté mal."
              action={<Button onClick={() => navigate('/admin/clientes')}>Ir a clientes</Button>}
            />
          ) : (
            <Alert>
              {e.message}{' '}
              <button type="button" className="underline" onClick={() => cliente.refetch()}>
                Intentar de nuevo
              </button>
            </Alert>
          )}
        </div>
      </>
    );
  }

  const c = cliente.data;

  return (
    <>
      <AppBar
        title={c.nombre}
        subtitle={`Cliente desde ${new Date(c.creadoEn).getFullYear()}`}
        onBack={volver}
        actions={
          <IconButton icon="edit" label="Editar cliente" onClick={() => setEditando(true)} />
        }
      />
      <Page>
        {/* HU-84 · Contacto rápido, como en el prototipo: Llamar y WhatsApp sobre «Contacto» */}
        <div className="flex gap-2">
          <ButtonLink
            href={enlaceTelefono(c.telefono)}
            variant="secondary"
            icon="phone"
            className="flex-1"
          >
            Llamar
          </ButtonLink>
          <ButtonLink
            href={enlaceWhatsApp(
              c.telefono,
              `Hola ${c.nombre.split(' ')[0]}, te escribimos de ${taller}.`,
            )}
            externo
            variant="secondary"
            icon="message"
            className="flex-1"
          >
            WhatsApp
          </ButtonLink>
        </div>
        <Card title="Contacto">
          <DataList
            items={[
              ['Celular', c.telefono],
              ['Correo', c.email ?? 'Sin correo'],
              ['Documento', `CC ${c.documentoIdentidad}`],
              ['Dirección', c.direccion ?? 'Sin dirección'],
              ['App MotoTrack', c.tieneCuenta ? 'Ya usa la app' : 'Aún no se registra'],
            ]}
          />
          {/* HU-86 · Si olvidó su contraseña, el taller le genera una clave temporal */}
          {c.tieneCuenta && (
            <Button
              variant="secondary"
              icon="lock"
              className="mt-3 w-full"
              onClick={() => setRestableciendo(true)}
            >
              Restablecer contraseña
            </Button>
          )}
        </Card>

        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">Motocicletas</h2>
        <List label="Motocicletas">
          {c.motos.map((m) => (
            <ListItem
              key={m.publicId}
              leading={<Plate placa={m.placa} />}
              title={`${m.marca} ${m.referencia}`}
              subtitle={
                m.ordenActiva
                  ? `${m.modelo} · Orden #${m.ordenActiva.numero} abierta`
                  : `${m.modelo} · ${km.format(m.kilometraje)} km`
              }
              trailing={m.ordenActiva ? <StatusBadge estado={m.ordenActiva.estado} /> : undefined}
              onClick={() => setMotoSheet({ open: true, moto: m })}
              aria-label={`Editar la moto ${m.placa}`}
            />
          ))}
          <ListItem
            icon="plus"
            title="Agregar moto"
            onClick={() => setMotoSheet({ open: true, moto: null })}
          />
        </List>

        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">Órdenes</h2>
        {c.ordenes.length === 0 ? (
          <p className="text-sm text-ink-muted">Sin órdenes todavía.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {c.ordenes.map((o) => {
              const moto = c.motos.find((m) => m.publicId === o.moto.publicId);
              return (
                <li key={o.publicId}>
                  <Link
                    to={`/admin/ordenes/${o.publicId}`}
                    aria-label={`Orden #${o.numero}`}
                    className="flex flex-col gap-2.5 rounded-md bg-surface-sunken px-4 py-3.5 text-ink transition-[transform,background-color] duration-150 ease-out hover:bg-surface-2 active:scale-[0.985]"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-3">
                        <Plate placa={o.moto.placa} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {moto ? `${moto.marca} ${moto.referencia}` : o.moto.placa}
                          </span>
                          <span className="block truncate text-sm text-ink-muted">{c.nombre}</span>
                        </span>
                      </span>
                      <Icon name="chevronRight" className="text-ink-muted" />
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge estado={o.estado} />
                      <span className="text-sm text-ink-muted">#{o.numero}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {c.motos.length > 0 && (
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => navigate(`/admin/ordenes/nueva?cliente=${c.publicId}`)}
          >
            Nueva orden
          </Button>
        )}
      </Page>

      <ClienteSheet open={editando} cliente={c} onClose={() => setEditando(false)} />
      <RestablecerClaveSheet
        open={restableciendo}
        nombre={c.nombre}
        taller={taller}
        restablecer={() => clientesApi.restablecerClave(c.publicId)}
        onClose={() => setRestableciendo(false)}
      />
      <MotoSheet
        open={motoSheet.open}
        moto={motoSheet.moto}
        clientePublicId={c.publicId}
        onClose={() => setMotoSheet((s) => ({ ...s, open: false }))}
      />
    </>
  );
}

const km = new Intl.NumberFormat('es-CO');
