import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Alert, Button, EmptyState, Input, SkeletonList, Tabs } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { Rol } from '@/types';
import { GRUPOS, type GrupoId } from '../estados';
import { useOrdenes } from '../hooks/use-ordenes';
import { OrdenCard } from './OrdenCard';

const VACIO: Record<Rol, { titulo: string; texto: string }> = {
  admin: {
    titulo: 'No hay órdenes aquí',
    texto: 'Cuando llegue una moto, crea su orden para empezar el trabajo.',
  },
  mecanico: {
    titulo: 'No tienes órdenes aquí',
    texto: 'Cuando el taller te asigne una moto, aparecerá en esta lista.',
  },
  cliente: {
    titulo: 'No tienes órdenes aquí',
    texto: 'Cuando lleves tu moto al taller, aquí verás en qué va.',
  },
};

const esGrupo = (v: string | null): v is GrupoId => GRUPOS.some((g) => g.id === v);

/**
 * HU-30 · Lista de órdenes con pestañas y buscador.
 * El backend decide qué órdenes ve cada rol; la pestaña y la búsqueda viven en la URL.
 */
export function OrdenesLista({ rol, accionVacia }: { rol: Rol; accionVacia?: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const grupoUrl = params.get('grupo');
  const grupo: GrupoId = esGrupo(grupoUrl) ? grupoUrl : 'todas';
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const q = useDebounce(texto.trim(), 300);
  const ordenes = useOrdenes(grupo, q);

  function actualizar(cambios: { grupo?: GrupoId; q?: string }) {
    const g = cambios.grupo ?? grupo;
    const t = cambios.q ?? texto;
    const nuevos: Record<string, string> = {};
    if (g !== 'todas') nuevos.grupo = g;
    if (t.trim()) nuevos.q = t.trim();
    setParams(nuevos, { replace: true });
  }

  const lista = ordenes.data?.pages.flatMap((p) => p.data) ?? [];
  const total = ordenes.data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {rol !== 'cliente' && (
        <div role="search">
          <Input
            label="Buscar orden"
            hideLabel
            type="search"
            placeholder={rol === 'admin' ? 'Placa, número o cliente' : 'Placa o número'}
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
        tabs={GRUPOS.map((g) => ({ id: g.id, label: g.label }))}
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
          title={q ? 'No encontramos órdenes' : VACIO[rol].titulo}
          text={q ? `Nada coincide con «${q}».` : VACIO[rol].texto}
          action={!q && grupo === 'todas' ? accionVacia : undefined}
        />
      )}
      {lista.length > 0 && (
        <>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {total === 1 ? '1 orden' : `${total} órdenes`}
          </p>
          <ul
            className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3"
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
    </div>
  );
}
