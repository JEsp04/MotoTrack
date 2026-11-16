import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Alert,
  AppBar,
  Button,
  EmptyState,
  Fab,
  Input,
  List,
  Page,
  SkeletonList,
  Tabs,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { CategoriaRepuesto, Repuesto } from '@/types';
import { useRepuestos, useResumenInventario } from '../hooks/use-repuestos';
import { CATEGORIAS } from './categorias';
import { RepuestoSheet } from './RepuestoSheet';
import { StockRow } from './StockRow';

type FiltroId = 'todos' | 'critico' | CategoriaRepuesto;

const ES_FILTRO = (v: string | null): v is FiltroId =>
  v === 'todos' || v === 'critico' || CATEGORIAS.some((c) => c.id === v);

/**
 * HU-54 · Pantalla de inventario (InventoryScreen del prototipo):
 * resumen de repuestos y stock crítico, buscador, chips de filtro, lista con barra de stock
 * y hoja para ver movimientos y registrar entrada/salida/ajuste (admin). El mecánico la ve
 * en solo lectura.
 */
export function InventarioVista({ soloLectura }: { soloLectura: boolean }) {
  const [params, setParams] = useSearchParams();
  const filtroParam = params.get('filtro');
  const filtro: FiltroId = ES_FILTRO(filtroParam) ? filtroParam : 'todos';
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const [elegido, setElegido] = useState<Repuesto | null>(null);
  const q = useDebounce(texto.trim(), 300);

  const categoria = filtro !== 'todos' && filtro !== 'critico' ? filtro : undefined;
  const critico = filtro === 'critico' ? true : undefined;

  const repuestos = useRepuestos({ q, categoria, critico });
  const resumen = useResumenInventario();

  function actualizar(cambios: { filtro?: FiltroId; q?: string }) {
    const f = cambios.filtro ?? filtro;
    const t = cambios.q ?? texto;
    const nuevos: Record<string, string> = {};
    if (f !== 'todos') nuevos.filtro = f;
    if (t.trim()) nuevos.q = t.trim();
    setParams(nuevos, { replace: true });
  }

  const lista = repuestos.data?.pages.flatMap((p) => p.data) ?? [];
  const total = resumen.data?.total;
  const criticos = resumen.data?.criticos;

  const subtitulo =
    total === undefined || criticos === undefined
      ? undefined
      : `${total} ${total === 1 ? 'repuesto' : 'repuestos'} · ${criticos} en stock crítico`;

  return (
    <>
      <AppBar title="Inventario" subtitle={subtitulo} />
      <Page pb={soloLectura ? undefined : 'fab'}>
        <div role="search">
          <Input
            label="Buscar repuesto"
            hideLabel
            type="search"
            placeholder="Buscar repuesto"
            autoComplete="off"
            maxLength={LIMITES.busqueda}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              actualizar({ q: e.target.value });
            }}
          />
        </div>

        <Tabs
          label="Filtrar inventario"
          variant="chips"
          value={filtro}
          onChange={(f) => actualizar({ filtro: f })}
          tabs={[
            { id: 'todos', label: 'Todos' },
            { id: 'critico', label: 'Stock crítico', count: criticos },
            ...CATEGORIAS,
          ]}
        />

        {repuestos.isPending && <SkeletonList rows={4} />}
        {repuestos.isError && (
          <Alert>
            {parseApiError(repuestos.error).message}{' '}
            <button type="button" className="underline" onClick={() => repuestos.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}

        {repuestos.isSuccess && lista.length === 0 && (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="box"
              title="Sin resultados"
              text={
                q
                  ? `Ningún repuesto coincide con «${q}».`
                  : filtro === 'critico'
                    ? 'No hay repuestos en stock crítico.'
                    : 'No hay repuestos en esta categoría.'
              }
            />
          </div>
        )}

        {lista.length > 0 && (
          <>
            <List label="Repuestos">
              {lista.map((r) => (
                <StockRow key={r.publicId} repuesto={r} onClick={() => setElegido(r)} />
              ))}
            </List>
            {repuestos.hasNextPage && (
              <Button
                variant="secondary"
                className="self-center"
                loading={repuestos.isFetchingNextPage}
                onClick={() => repuestos.fetchNextPage()}
              >
                Ver más
              </Button>
            )}
          </>
        )}
      </Page>

      {!soloLectura && <Fab label="Repuesto" to="/admin/inventario/nuevo" />}

      <RepuestoSheet
        repuesto={elegido}
        soloLectura={soloLectura}
        onClose={() => setElegido(null)}
      />
    </>
  );
}
