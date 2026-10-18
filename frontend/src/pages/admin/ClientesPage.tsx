import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Badge,
  Button,
  EmptyState,
  Icon,
  Input,
  Plate,
  SkeletonList,
} from '@/components/ui';
import { ClienteSheet, useClientes } from '@/features/clientes';
import { parseApiError } from '@/lib/api-error';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { ClienteResumen } from '@/types';

/** HU-24 y HU-25 · Buscar, ver y registrar clientes del taller. */
export default function ClientesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // La búsqueda vive en la URL (?q=): se conserva al volver del detalle
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const q = useDebounce(texto.trim(), 300);
  const clientes = useClientes(q);
  const [creando, setCreando] = useState(false);

  function buscar(valor: string) {
    setTexto(valor);
    setParams(valor.trim() ? { q: valor.trim() } : {}, { replace: true });
  }

  const lista = clientes.data?.pages.flatMap((p) => p.data) ?? [];
  const total = clientes.data?.pages[0]?.meta.total ?? 0;
  const nuevo = (
    <Button icon="plus" size="sm" onClick={() => setCreando(true)} aria-label="Nuevo cliente">
      <span className="hidden sm:inline">Nuevo cliente</span>
    </Button>
  );

  return (
    <>
      <AppBar
        title="Clientes"
        subtitle="Busca por nombre, documento, teléfono o placa"
        actions={nuevo}
      />
      <div className="flex flex-col gap-4 p-4 lg:px-0">
        <div role="search">
          <Input
            label="Buscar cliente"
            type="search"
            placeholder="Nombre, documento, celular o placa"
            autoComplete="off"
            maxLength={LIMITES.busqueda}
            value={texto}
            onChange={(e) => buscar(e.target.value)}
          />
        </div>

        {clientes.isPending && <SkeletonList rows={4} />}
        {clientes.isError && (
          <Alert>
            {parseApiError(clientes.error).message}{' '}
            <button type="button" className="underline" onClick={() => clientes.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}

        {clientes.isSuccess && lista.length === 0 && (
          <EmptyState
            icon="users"
            title={q ? 'No encontramos clientes' : 'Aún no tienes clientes'}
            text={
              q
                ? `Nada coincide con «${q}». Revisa lo que escribiste o regístralo.`
                : 'Registra a los clientes que llegan al taller para abrirles órdenes.'
            }
            action={
              <Button icon="plus" onClick={() => setCreando(true)}>
                Registrar cliente
              </Button>
            }
          />
        )}

        {lista.length > 0 && (
          <>
            <p className="text-sm text-ink-muted" aria-live="polite">
              {total === 1 ? '1 cliente' : `${total} clientes`}
            </p>
            <ul
              className="flex flex-col divide-y divide-border overflow-hidden rounded-md bg-surface-sunken"
              aria-label="Clientes"
            >
              {lista.map((c) => (
                <li key={c.publicId}>
                  <FilaCliente cliente={c} />
                </li>
              ))}
            </ul>
            {clientes.hasNextPage && (
              <Button
                variant="secondary"
                className="self-center"
                loading={clientes.isFetchingNextPage}
                onClick={() => clientes.fetchNextPage()}
              >
                Ver más
              </Button>
            )}
          </>
        )}
      </div>

      <ClienteSheet
        open={creando}
        onClose={() => setCreando(false)}
        onCreado={(c) => navigate(`/admin/clientes/${c.publicId}`)}
        onVerExistente={(documento) => buscar(documento)}
      />
    </>
  );
}

function FilaCliente({ cliente }: { cliente: ClienteResumen }) {
  return (
    <Link
      to={`/admin/clientes/${cliente.publicId}`}
      className="flex items-center gap-3.5 p-4 transition-colors duration-150 hover:bg-surface-2 sm:px-5"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-surface text-sm font-semibold"
        aria-hidden="true"
      >
        {cliente.nombre
          .split(' ')
          .slice(0, 2)
          .map((p) => p[0])
          .join('')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{cliente.nombre}</p>
          {cliente.tieneCuenta && (
            <Badge tono="neutral" className="bg-surface">
              Usa la app
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-muted">
          CC {cliente.documentoIdentidad} · {cliente.telefono}
        </p>
        {cliente.motos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cliente.motos.map((m) => (
              <Plate key={m.publicId} placa={m.placa} size="sm" />
            ))}
          </div>
        )}
      </div>
      <Icon name="chevronRight" className="shrink-0 text-ink-muted" size={20} />
    </Link>
  );
}
