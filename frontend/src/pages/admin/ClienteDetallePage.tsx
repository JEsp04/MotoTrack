import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  Button,
  Card,
  EmptyState,
  Plate,
  Skeleton,
  SkeletonList,
  StatusBadge,
} from '@/components/ui';
import { ClienteSheet, useCliente } from '@/features/clientes';
import { MotoCard, MotoSheet } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
import { formatFecha, formatPesos } from '@/lib/format';
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
        <div className="flex flex-col gap-4 p-4 lg:px-0" role="status" aria-label="Cargando">
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
        <div className="p-4 lg:px-0">
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
  const agregarMoto = (
    <Button icon="plus" size="sm" onClick={() => setMotoSheet({ open: true, moto: null })}>
      Agregar moto
    </Button>
  );

  return (
    <>
      <AppBar
        title={c.nombre}
        subtitle={`CC ${c.documentoIdentidad}`}
        onBack={volver}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>
            Editar
          </Button>
        }
      />
      <div className="flex flex-col gap-6 p-4 lg:px-0">
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Dato titulo="Celular" valor={c.telefono} />
            <Dato titulo="Correo" valor={c.email ?? 'Sin correo'} />
            <Dato titulo="Dirección" valor={c.direccion ?? 'Sin dirección'} />
            <div>
              <dt className="text-xs font-semibold text-ink-muted">App MotoTrack</dt>
              <dd className="mt-1">
                {c.tieneCuenta ? (
                  <Badge tono="primary">Ya usa la app</Badge>
                ) : (
                  <span className="text-sm">Aún no se registra</span>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <section aria-labelledby="titulo-motos" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="titulo-motos" className="text-lg">
              Motos ({c.motos.length})
            </h2>
            {c.motos.length > 0 && agregarMoto}
          </div>
          {c.motos.length === 0 ? (
            <EmptyState
              icon="moto"
              title="Sin motos registradas"
              text="Registra su moto para poder abrirle una orden."
              action={agregarMoto}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {c.motos.map((m) => (
                <li key={m.publicId}>
                  <MotoCard
                    moto={m}
                    onEditar={(moto) => setMotoSheet({ open: true, moto })}
                    enlaceOrden={(id) => `/admin/ordenes/${id}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-ordenes" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="titulo-ordenes" className="text-lg">
              Órdenes
            </h2>
            {c.motos.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                icon="plus"
                onClick={() => navigate(`/admin/ordenes/nueva?cliente=${c.publicId}`)}
              >
                Nueva orden
              </Button>
            )}
          </div>
          {c.ordenes.length === 0 ? (
            <p className="text-ink-muted">Todavía no tiene órdenes de servicio.</p>
          ) : (
            <Card flush>
              <ul className="divide-y divide-border">
                {c.ordenes.map((o) => (
                  <li key={o.publicId} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
                    <Link
                      to={`/admin/ordenes/${o.publicId}`}
                      className="font-semibold text-ink underline"
                    >
                      Orden #{o.numero}
                    </Link>
                    <Plate placa={o.moto.placa} size="sm" />
                    <StatusBadge estado={o.estado} />
                    <span className="ml-auto text-sm text-ink-muted">
                      {formatFecha(o.fechaIngreso)}
                      {o.costoTotal > 0 && ` · ${formatPesos(o.costoTotal)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>

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

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-ink-muted">{titulo}</dt>
      <dd className="mt-1 break-words">{valor}</dd>
    </div>
  );
}
