import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Alert,
  AppBar,
  Button,
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
import { ClienteSheet, useCliente } from '@/features/clientes';
import { MotoSheet } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
import type { Moto } from '@/types';

/** HU-25 · Detalle de un cliente: datos, motos (HU-26) y órdenes. */
export default function ClienteDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const cliente = useCliente(id);
  const [editando, setEditando] = useState(false);
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
        </Card>

        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">Motocicletas</h2>
        <List label="Motocicletas">
          {c.motos.map((m) => (
            <ListItem
              key={m.publicId}
              leading={<Plate placa={m.placa} />}
              title={`${m.marca} ${m.referencia}`}
              subtitle={`${m.modelo} · ${km.format(m.kilometraje)} km`}
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
