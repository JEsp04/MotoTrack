import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Button,
  EmptyState,
  Fab,
  Input,
  Page,
  SkeletonList,
  Tabs,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { Rol } from '@/types';
import { GRUPOS, type GrupoId } from '../estados';
import { useConteoOrdenes, useOrdenes } from '../hooks/use-ordenes';
import { OrdenCard } from './OrdenCard';

const esGrupo = (v: string | null): v is GrupoId => GRUPOS.some((g) => g.id === v);

/**
 * HU-30, HU-47 · Pantalla de órdenes (OrdersScreen del prototipo): buscador, filtros en
 * píldora con su conteo, tarjetas y, para el admin, el botón flotante «Nueva orden».
 * El backend decide qué órdenes ve cada rol; el filtro y la búsqueda viven en la URL.
 */
export function OrdenesLista({ rol, titulo }: { rol: Rol; titulo: string }) {
  const [params, setParams] = useSearchParams();
  const grupoUrl = params.get('grupo');
  const grupo: GrupoId = esGrupo(grupoUrl) ? grupoUrl : 'todas';
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const q = useDebounce(texto.trim(), 300);
  const ordenes = useOrdenes(grupo, q);
  const conteo = useConteoOrdenes();

  function actualizar(cambios: { grupo?: GrupoId; q?: string }) {
    const g = cambios.grupo ?? grupo;
    const t = cambios.q ?? texto;
    const nuevos: Record<string, string> = {};
    if (g !== 'todas') nuevos.grupo = g;
    if (t.trim()) nuevos.q = t.trim();
    setParams(nuevos, { replace: true });
  }

  const lista = ordenes.data?.pages.flatMap((p) => p.data) ?? [];
  const activas = conteo.data
    ? conteo.data.en_proceso + conteo.data.por_aprobar + conteo.data.listas
    : undefined;

  return (
    <>
      <AppBar
        title={titulo}
        subtitle={
          activas === undefined ? undefined : `${activas} ${activas === 1 ? 'activa' : 'activas'}`
        }
      />
      <Page pb={rol === 'admin' ? 'fab' : undefined}>
        {rol !== 'cliente' && (
          <div role="search">
            <Input
              label="Buscar orden"
              hideLabel
              type="search"
              placeholder={rol === 'admin' ? 'Placa, cliente o número' : 'Placa o número'}
              autoComplete="off"
              maxLength={LIMITES.busqueda}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                actualizar({ q: e.target.value });
              }}
            />
          </div>
        )}
        <Tabs
          label="Filtrar órdenes"
          tabs={GRUPOS.map((g) => ({ id: g.id, label: g.label, count: conteo.data?.[g.id] }))}
          value={grupo}
          onChange={(g) => actualizar({ grupo: g })}
        />

        {ordenes.isPending && <SkeletonList rows={4} />}
        {ordenes.isError && (
          <Alert>
            {parseApiError(ordenes.error).message}{' '}
            <button type="button" className="underline" onClick={() => ordenes.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {ordenes.isSuccess && lista.length === 0 && (
          <EmptyState
            icon="clipboard"
            title="Sin órdenes aquí"
            text={
              q
                ? `Ninguna orden coincide con «${q}».`
                : 'Cuando una orden llegue a este estado aparecerá en esta lista.'
            }
          />
        )}
        {lista.length > 0 && (
          <>
            <ul
              className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
              aria-label="Órdenes"
            >
              {lista.map((o) => (
                <li key={o.publicId}>
                  <OrdenCard orden={o} rol={rol} />
                </li>
              ))}
            </ul>
            {ordenes.hasNextPage && (
              <Button
                variant="secondary"
                className="self-center"
                loading={ordenes.isFetchingNextPage}
                onClick={() => ordenes.fetchNextPage()}
              >
                Ver más
              </Button>
            )}
          </>
        )}
      </Page>
      {rol === 'admin' && <Fab label="Nueva orden" to="/admin/ordenes/nueva" />}
    </>
  );
}
