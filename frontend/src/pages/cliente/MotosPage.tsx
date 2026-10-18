import { useState } from 'react';
import { Alert, AppBar, Button, EmptyState, SkeletonList } from '@/components/ui';
import { MotoCard, MotoSheet, useMotos } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
import type { Moto } from '@/types';

/** HU-26 y HU-27 · El cliente ve sus motos, en qué va cada una y puede agregar más. */
export default function MotosPage() {
  const motos = useMotos();
  const [sheet, setSheet] = useState<{ open: boolean; moto: Moto | null }>({
    open: false,
    moto: null,
  });
  const agregar = (
    <Button icon="plus" size="sm" onClick={() => setSheet({ open: true, moto: null })}>
      Agregar moto
    </Button>
  );
  const lista = motos.data?.data ?? [];

  return (
    <>
      <AppBar
        title="Mis motos"
        subtitle="En qué va cada una"
        actions={
          lista.length > 0 ? (
            <Button
              icon="plus"
              size="sm"
              onClick={() => setSheet({ open: true, moto: null })}
              aria-label="Agregar moto"
            >
              <span className="hidden sm:inline">Agregar moto</span>
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-3 p-4 lg:px-0">
        {motos.isPending && <SkeletonList rows={2} />}
        {motos.isError && (
          <Alert>
            {parseApiError(motos.error).message}{' '}
            <button type="button" className="underline" onClick={() => motos.refetch()}>
              Intentar de nuevo
            </button>
          </Alert>
        )}
        {motos.isSuccess && lista.length === 0 && (
          <EmptyState
            icon="moto"
            title="Aún no tienes motos registradas"
            text="Agrégalas para tenerlas listas cuando llegues al taller."
            action={agregar}
          />
        )}
        {lista.length > 0 && (
          <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-2" aria-label="Mis motos">
            {lista.map((m) => (
              <li key={m.publicId}>
                <MotoCard
                  moto={m}
                  onEditar={(moto) => setSheet({ open: true, moto })}
                  enlaceOrden={(id) => `/cliente/ordenes/${id}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <MotoSheet
        open={sheet.open}
        moto={sheet.moto}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
