import { useState } from 'react';
import { Alert, EmptyState, List, ListItem, Plate, SkeletonList } from '@/components/ui';
import { useSession } from '@/features/auth';
import { MotoSheet, useMotos } from '@/features/motos';
import { OrdenClienteCard, useMisOrdenesActivas } from '@/features/ordenes';
import { parseApiError } from '@/lib/api-error';
import type { Moto } from '@/types';

const km = new Intl.NumberFormat('es-CO');

/**
 * HU-26, HU-27, HU-49 · Inicio del cliente (ClientHomeScreen del prototipo): sus órdenes
 * abiertas arriba, con la que espera su respuesta resaltada, y sus motos.
 */
export default function MotosPage() {
  const usuario = useSession((s) => s.usuario);
  const motos = useMotos();
  const ordenes = useMisOrdenesActivas();
  const [sheet, setSheet] = useState<{ open: boolean; moto: Moto | null }>({
    open: false,
    moto: null,
  });
  const lista = motos.data?.data ?? [];
  const activas = ordenes.data ?? [];
  const taller = usuario?.taller.nombre ?? '';
  const error = motos.error ?? ordenes.error;

  return (
    <>
      {/* Saludo (.mt-hero) */}
      <header className="border-b border-border px-4 pt-4 pb-14 lg:px-8 lg:pt-6 lg:pb-16">
        <div className="mx-auto w-full max-w-[1200px]">
          <p className="text-sm leading-5 text-ink-muted">Portal del cliente</p>
          <h1 className="mt-1 text-[26px] leading-[30px] font-semibold tracking-[-0.03em]">
            Hola, {usuario?.nombre.split(' ')[0]}
          </h1>
        </div>
      </header>

      <div className="mx-auto -mt-11 w-full max-w-[1200px] px-4 pb-[calc(var(--spacing-bottom-nav)+24px)] lg:px-8 lg:pb-8">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {error && (
              <Alert>
                {parseApiError(error).message}{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void motos.refetch();
                    void ordenes.refetch();
                  }}
                >
                  Intentar de nuevo
                </button>
              </Alert>
            )}
            {ordenes.isPending && <SkeletonList rows={1} />}
            {ordenes.isSuccess &&
              (activas.length > 0 ? (
                activas.map((o) => <OrdenClienteCard key={o.publicId} orden={o} taller={taller} />)
              ) : (
                <div className="rounded-[22px] bg-surface-sunken">
                  <EmptyState
                    icon="moto"
                    title="Sin órdenes activas"
                    text={
                      lista.length
                        ? 'Cuando dejes tu moto en el taller, verás aquí su estado y la cotización.'
                        : 'Agrega tu moto para empezar.'
                    }
                  />
                </div>
              ))}

            <h2 className="text-lg leading-6 font-semibold">Mis motos</h2>
            {motos.isPending && <SkeletonList rows={1} />}
            {motos.isSuccess && lista.length === 0 && (
              <p className="text-sm leading-5 text-ink-muted">Aún no tienes motos registradas.</p>
            )}
            {motos.isSuccess && (
              <List label="Mis motos">
                {lista.map((m) => (
                  <ListItem
                    key={m.publicId}
                    leading={<Plate placa={m.placa} />}
                    title={`${m.marca} ${m.referencia}`}
                    subtitle={`${km.format(m.kilometraje)} km`}
                    onClick={() => setSheet({ open: true, moto: m })}
                  />
                ))}
                <ListItem
                  icon="plus"
                  title={lista.length ? 'Agregar otra moto' : 'Agregar mi moto'}
                  onClick={() => setSheet({ open: true, moto: null })}
                />
              </List>
            )}
          </div>
        </div>
      </div>

      <MotoSheet
        open={sheet.open}
        moto={sheet.moto}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
