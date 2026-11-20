import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Alert,
  AppBar,
  ButtonLink,
  Card,
  DataList,
  EmptyState,
  IconButton,
  Page,
  Plate,
  SkeletonList,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatFecha, formatPesos } from '@/lib/format';
import type { Rol } from '@/types';
import { useMoto } from '../hooks/use-motos';
import { MotoSheet } from './MotoSheet';

const km = new Intl.NumberFormat('es-CO');

/**
 * HU-61 · Ficha de la moto (MotoScreen del prototipo): placa grande, kilometraje, modelo,
 * número de servicios y el historial de órdenes terminadas, la más reciente primero.
 * «Pedir cita» (cliente) o «Agendar cita» (admin) lleva a las citas.
 */
export function MotoFichaVista({
  publicId,
  rol,
}: {
  publicId: string;
  rol: Extract<Rol, 'admin' | 'cliente'>;
}) {
  const navigate = useNavigate();
  const moto = useMoto(publicId);
  const [editando, setEditando] = useState(false);
  const cliente = rol === 'cliente';

  if (!moto.isSuccess) {
    return (
      <>
        <AppBar title="Moto" onBack={() => navigate(-1)} />
        <Page narrow>
          {moto.isPending && <SkeletonList rows={2} />}
          {moto.isError && <Alert>{parseApiError(moto.error).message}</Alert>}
        </Page>
      </>
    );
  }

  const m = moto.data;
  const servicios = m.historial;

  return (
    <>
      <AppBar
        title={`${m.marca} ${m.referencia}`}
        subtitle={m.cliente.nombre}
        onBack={() => navigate(-1)}
        actions={<IconButton icon="edit" label="Editar moto" onClick={() => setEditando(true)} />}
      />
      <Page narrow>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <Plate placa={m.placa} size="lg" />
            <div className="text-right">
              <p className="font-num text-[26px] leading-8">{km.format(m.kilometraje)}</p>
              <p className="text-sm leading-5 text-ink-muted">km registrados</p>
            </div>
          </div>
          <div className="mt-4">
            <DataList
              items={[
                ['Modelo', m.modelo],
                ['Servicios', servicios.length],
                m.ordenActiva && [
                  'En el taller',
                  <Link
                    key="orden"
                    to={`/${rol}/ordenes/${m.ordenActiva.publicId}`}
                    className="underline decoration-border-strong underline-offset-4"
                  >
                    Orden #{m.ordenActiva.numero}
                  </Link>,
                ],
              ]}
            />
          </div>
        </Card>

        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">
          Historial de servicios
        </h2>
        {servicios.length === 0 ? (
          <div className="rounded-md bg-surface-sunken">
            <EmptyState
              icon="history"
              title="Sin servicios todavía"
              text="Cuando la moto pase por el taller, su historial aparecerá aquí."
            />
          </div>
        ) : (
          <Card>
            <ol className="m-0 list-none p-0" aria-label="Historial de servicios">
              {servicios.map((s, i) => (
                <li key={s.publicId} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="flex w-6 shrink-0 flex-col items-center" aria-hidden="true">
                    <span className="mt-1.5 size-3 shrink-0 rounded-full bg-ink" />
                    {i < servicios.length - 1 && <span className="mt-1 w-0.5 flex-1 bg-border" />}
                  </span>
                  <Link
                    to={`/${rol}/ordenes/${s.publicId}`}
                    className="min-w-0 flex-1 text-ink"
                    aria-label={`Orden #${s.numero} · ${s.motivoIngreso}`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-semibold">{s.motivoIngreso}</span>
                      <span className="shrink-0 text-sm text-ink-muted">#{s.numero}</span>
                    </span>
                    <span className="flex items-baseline justify-between gap-2 text-sm leading-5 text-ink-muted">
                      <span>
                        {formatFecha(s.fechaEntrega ?? s.fechaIngreso)} ·{' '}
                        {km.format(s.kilometrajeIngreso)} km
                      </span>
                      <span className="shrink-0 font-num text-ink">
                        {formatPesos(s.costoTotal)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        )}

        <ButtonLink
          href={cliente ? '/cliente/citas/nueva' : '/admin/citas'}
          variant="secondary"
          icon="calendar"
          fullWidth
        >
          {cliente ? 'Pedir cita' : 'Agendar cita'}
        </ButtonLink>
      </Page>
      <MotoSheet
        open={editando}
        moto={m}
        onClose={() => setEditando(false)}
        onEliminada={() =>
          navigate(cliente ? '/cliente' : `/admin/clientes/${m.cliente.publicId}`, {
            replace: true,
          })
        }
      />
    </>
  );
}
