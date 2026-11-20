import { Link } from 'react-router';
import { Logo } from '@/components/layout';
import { ButtonLink, Card, DataList, EmptyState, Note, Page, SkeletonList } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatDia, formatFecha } from '@/lib/format';
import { useSeguimientoPublico } from '../hooks/use-ordenes';
import { CotizacionCard, EncabezadoSeguimiento, TarjetaTaller } from './SeguimientoPartes';

/**
 * HU-90 · Seguimiento por enlace (`/s/:id`), sin cuenta: el estado, la cotización y el
 * contacto del taller, en solo lectura. Para aprobar, ver el historial o calificar hay que
 * iniciar sesión. Usa las mismas piezas del seguimiento del cliente (TrackingScreen).
 */
export function SeguimientoPublico({ publicId }: { publicId: string }) {
  const seguimiento = useSeguimientoPublico(publicId);
  const orden = seguimiento.data;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-surface/78 px-4 backdrop-blur-[18px] backdrop-saturate-[1.4] lg:h-topnav lg:px-6">
        <Link to="/" aria-label="MotoTrack, inicio" className="rounded-sm">
          <Logo />
        </Link>
        <ButtonLink href="/login?tab=cliente" variant="ghost" size="sm">
          Iniciar sesión
        </ButtonLink>
      </header>

      <main id="contenido">
        {seguimiento.isPending && (
          <Page narrow>
            <SkeletonList rows={3} />
          </Page>
        )}

        {seguimiento.isError && (
          <Page narrow>
            <div className="rounded-md bg-surface-sunken">
              <EmptyState
                icon="search"
                title="No encontramos esta orden"
                text={
                  parseApiError(seguimiento.error).status === 404
                    ? 'Revisa que el enlace esté completo o pídele uno nuevo al taller.'
                    : parseApiError(seguimiento.error).message
                }
              />
            </div>
          </Page>
        )}

        {orden && (
          <>
            <div className="mx-auto w-full max-w-form px-4 pt-4 lg:px-8">
              <h1 className="text-lg leading-6 font-semibold tracking-[-0.02em]">
                Orden #{orden.numero}
              </h1>
              <p className="text-sm leading-5 text-ink-muted">{orden.taller.nombre}</p>
            </div>
            <EncabezadoSeguimiento orden={orden} taller={orden.taller.nombre} propia={false} />
            <Page narrow>
              {orden.estado === 'esperando_aprobacion' && (
                <Note icon="clock" tono="accent">
                  Para aprobar o rechazar la cotización, inicia sesión o escríbele al taller.
                </Note>
              )}
              <CotizacionCard
                items={orden.servicios}
                diagnostico={orden.diagnostico}
                costoTotal={orden.costoTotal}
                cancelada={orden.estado === 'cancelada'}
              />
              <Card title="La orden">
                <DataList
                  items={[
                    ['Motivo', orden.motivoIngreso],
                    ['Ingreso', formatFecha(orden.fechaIngreso)],
                    !!orden.fechaEstimadaEntrega && [
                      'Entrega estimada',
                      <span key="e" className={orden.atrasada ? 'text-danger-text' : undefined}>
                        {formatDia(orden.fechaEstimadaEntrega)}
                        {orden.atrasada ? ' · atrasada' : ''}
                      </span>,
                    ],
                    !!orden.fechaEntrega && ['Entregada', formatFecha(orden.fechaEntrega)],
                  ]}
                />
              </Card>
              <TarjetaTaller taller={orden.taller} orden={orden} />
              <Card title="¿Es tu moto?">
                <p className="text-sm leading-5 text-ink-muted">
                  Inicia sesión con tu cuenta de cliente para aprobar la cotización, ver el
                  historial de la orden y calificar el servicio.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <ButtonLink href="/login?tab=cliente" className="sm:flex-1">
                    Iniciar sesión
                  </ButtonLink>
                  <ButtonLink href="/registro/cliente" variant="light" className="sm:flex-1">
                    Crear cuenta
                  </ButtonLink>
                </div>
              </Card>
            </Page>
          </>
        )}
      </main>
    </div>
  );
}
