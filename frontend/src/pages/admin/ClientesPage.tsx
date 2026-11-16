import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Button,
  EmptyState,
  Fab,
  Input,
  List,
  ListItem,
  Page,
  SkeletonList,
} from '@/components/ui';
import { ClienteSheet, useClientes } from '@/features/clientes';
import { parseApiError } from '@/lib/api-error';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';

/** HU-24 y HU-25 · Buscar, ver y registrar clientes del taller (ClientsScreen del prototipo). */
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
  const motos = lista.reduce((s, c) => s + c.motos.length, 0);

  return (
    <>
      <AppBar
        title="Clientes"
        subtitle={
          clientes.isSuccess
            ? `${total === 1 ? '1 cliente' : `${total} clientes`} · ${motos === 1 ? '1 moto' : `${motos} motos`}`
            : undefined
        }
      />
      <Page pb="fab">
        <div role="search">
          <Input
            label="Buscar cliente"
            hideLabel
            type="search"
            placeholder="Nombre, celular o placa"
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
          <div className="rounded-md bg-surface-sunken">
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
          </div>
        )}

        {lista.length > 0 && (
          <>
            <List label="Clientes">
              {lista.map((c) => (
                <ListItem
                  key={c.publicId}
                  initials={c.nombre}
                  title={c.nombre}
                  subtitle={[...c.motos.map((m) => m.placa), c.telefono].join(' · ')}
                  to={`/admin/clientes/${c.publicId}`}
                />
              ))}
            </List>
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
      </Page>
      <Fab label="Cliente" onClick={() => setCreando(true)} />

      <ClienteSheet
        open={creando}
        onClose={() => setCreando(false)}
        onCreado={(c) => navigate(`/admin/clientes/${c.publicId}`)}
        onVerExistente={(documento) => buscar(documento)}
      />
    </>
  );
}
