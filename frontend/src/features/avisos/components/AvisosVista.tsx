import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  AppBar,
  BottomSheet,
  Button,
  EmptyState,
  Icon,
  Page,
  Segmented,
  SkeletonList,
  type IconName,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import type { Aviso, TipoAviso } from '@/types';
import { useAvisos, useMarcarLeido } from '../hooks/use-avisos';
import { cuandoAviso } from './cuando';

/** Ícono y tono de cada tipo de aviso (ClientNotificationsScreen del prototipo) */
const ICONO: Record<TipoAviso, IconName> = {
  estado: 'moto',
  cotizacion: 'receipt',
  cita: 'calendar',
  recordatorio: 'sparkle',
};
const TONO: Record<TipoAviso, string> = {
  estado: 'bg-surface-2 text-ink',
  cotizacion: 'bg-accent-soft text-accent-text',
  cita: 'bg-surface-2 text-ink',
  recordatorio: 'bg-surface-2 text-ink',
};

type Filtro = 'todos' | 'sin-leer';

export interface AvisosVistaProps {
  /** Ruta base del rol: «/cliente» o «/admin», para abrir el detalle de la orden */
  base: '/cliente' | '/admin';
  onBack?: () => void;
}

/**
 * HU-70 · Pantalla «Avisos» (ClientNotificationsScreen del prototipo): «N sin leer», filtro
 * «Sin leer», fila resaltada con punto si no se ha leído y hoja con el detalle. Al abrir un
 * aviso queda leído; si es de una orden, el botón lleva a su detalle.
 */
export function AvisosVista({ base, onBack }: AvisosVistaProps) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [abierto, setAbierto] = useState<Aviso | null>(null);
  const avisos = useAvisos(filtro === 'sin-leer');
  const marcar = useMarcarLeido();
  const navigate = useNavigate();
  const lista = avisos.data?.data ?? [];
  const noLeidos = avisos.data?.meta.noLeidos;

  function abrir(a: Aviso) {
    if (!a.leido) marcar.mutate(a.publicId);
    setAbierto(a);
  }

  const esCliente = base === '/cliente';
  const textoBoton =
    abierto?.tipo === 'cotizacion' && esCliente
      ? 'Revisar cotización'
      : esCliente
        ? 'Ver mi orden'
        : 'Ver la orden';

  return (
    <>
      <AppBar
        title="Avisos"
        subtitle={noLeidos === undefined ? undefined : `${noLeidos} sin leer`}
        onBack={onBack}
      />
      <Page narrow>
        <Segmented
          label="Filtrar avisos"
          value={filtro}
          onChange={setFiltro}
          options={[
            { id: 'todos', label: 'Todos' },
            { id: 'sin-leer', label: 'Sin leer' },
          ]}
        />

        {avisos.isError && (
          <Alert>
            {parseApiError(avisos.error).message}{' '}
            <button type="button" className="underline" onClick={() => void avisos.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {avisos.isPending && <SkeletonList rows={4} />}

        {avisos.isSuccess && lista.length === 0 && (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="bell"
              title={filtro === 'sin-leer' ? 'Estás al día' : 'Sin avisos'}
              text={
                filtro === 'sin-leer'
                  ? 'No tienes avisos sin leer.'
                  : 'Aquí te contaremos cada vez que una orden avance.'
              }
            />
          </div>
        )}

        {lista.length > 0 && (
          <ul
            aria-label="Avisos"
            className="flex flex-col overflow-hidden rounded-md bg-surface-sunken"
          >
            {lista.map((a) => (
              <li key={a.publicId} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => abrir(a)}
                  className={cn(
                    'flex min-h-16 w-full items-start gap-3 px-4 py-3 text-left text-ink transition-colors duration-150',
                    a.leido ? 'hover:bg-surface-2' : 'bg-accent-soft',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      TONO[a.tipo],
                    )}
                  >
                    <Icon name={ICONO[a.tipo]} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a.titulo}</span>
                    <span className="block text-sm leading-5 text-ink-muted">{a.texto}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs leading-4 text-ink-muted">
                      {cuandoAviso(a.creadoEn)}
                    </span>
                    {!a.leido && (
                      <span className="block size-2.5 rounded-full bg-ink">
                        <span className="sr-only">Sin leer</span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Page>

      <BottomSheet
        open={Boolean(abierto)}
        title={abierto?.titulo ?? ''}
        onClose={() => setAbierto(null)}
        footer={
          abierto?.orden ? (
            <Button
              fullWidth
              onClick={() => {
                const publicId = abierto.orden!.publicId;
                setAbierto(null);
                void navigate(`${base}/ordenes/${publicId}`);
              }}
            >
              {textoBoton}
            </Button>
          ) : undefined
        }
      >
        {abierto && (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-5 text-ink-muted">
              {cuandoAviso(abierto.creadoEn)} · En la app
            </p>
            <p className="rounded-[18px] bg-surface-sunken p-3 text-sm leading-5">
              {abierto.texto}
            </p>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
