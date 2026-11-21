import { useState } from 'react';
import {
  Alert,
  AppBar,
  Badge,
  BottomSheet,
  Button,
  DataList,
  List,
  ListItem,
  Page,
  SkeletonList,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatFecha, formatPesos } from '@/lib/format';
import type { Factura, PlanTaller } from '@/types';
import { useSuscripcion } from '../hooks/use-suscripcion';
import { fechaDia, PLANES } from '../planes';
import { CambiarPlanSheet } from './CambiarPlanSheet';

/**
 * HU-80 · «Taller y suscripción» (SubscriptionScreen del prototipo): plan actual, próximo
 * cobro, «Cambiar plan» y facturas con subtotal, IVA (19 %) y total.
 * HU-81 · «Cambiar plan», «Elegir plan» y «Cambiar tarjeta» llevan a «Pago seguro».
 */
export function SuscripcionVista({
  taller,
  onBack,
  onPagar,
}: {
  taller: string;
  onBack: () => void;
  /** Abre «Pago seguro»: cobrar un plan o cambiar la tarjeta */
  onPagar: (pago: { tipo: 'plan'; plan: PlanTaller } | { tipo: 'metodo' }) => void;
}) {
  const datos = useSuscripcion();
  const [cambiando, setCambiando] = useState(false);
  const [factura, setFactura] = useState<Factura | null>(null);
  const s = datos.data?.suscripcion ?? null;

  return (
    <>
      <AppBar title="Taller y suscripción" subtitle={taller} onBack={onBack} />
      <Page narrow>
        {datos.isPending && <SkeletonList rows={3} />}
        {datos.isError && <Alert tono="danger">{parseApiError(datos.error).message}</Alert>}

        {datos.isSuccess && s && (
          <section
            aria-label="Plan actual"
            className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm leading-5 text-ink-muted">Plan actual</p>
                <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">{s.nombre}</h2>
              </div>
              <Badge tono="success" icon="check">
                Activa
              </Badge>
            </div>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <b className="font-num text-[30px] leading-9">{formatPesos(s.precio)}</b>
              <span className="text-sm text-ink-muted">COP / mes · IVA incluido</span>
            </p>
            <DataList
              items={[
                ['Próximo cobro', formatFecha(fechaDia(s.proximoCobro))],
                ['Valor del próximo cobro', formatPesos(s.proximaFactura.total)],
                ['Medio de pago', s.medioPago ?? 'Sin tarjeta'],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="light" icon="settings" onClick={() => setCambiando(true)}>
                Cambiar plan
              </Button>
              <Button
                size="sm"
                variant="light"
                icon="receipt"
                onClick={() => onPagar({ tipo: 'metodo' })}
              >
                Cambiar tarjeta
              </Button>
            </div>
          </section>
        )}

        {datos.isSuccess && !s && (
          <section className="flex flex-col gap-3 rounded-md bg-surface-sunken p-4">
            <h2 className="text-lg leading-6 font-semibold">Tu taller aún no tiene un plan</h2>
            <p className="text-sm leading-5 text-ink-muted">
              Para usar MotoTrack, elige un plan y págalo: Básico por{' '}
              {formatPesos(PLANES.basico.precio)} al mes o Inteligente por{' '}
              {formatPesos(PLANES.inteligente.precio)}, IVA incluido.
            </p>
            <Button icon="receipt" onClick={() => setCambiando(true)}>
              Elegir plan
            </Button>
          </section>
        )}

        {datos.isSuccess && (
          <>
            <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">Facturas</h2>
            {datos.data.facturas.length === 0 ? (
              <p className="text-sm leading-5 text-ink-muted">Aún no hay facturas.</p>
            ) : (
              <List label="Facturas">
                {datos.data.facturas.map((f) => (
                  <ListItem
                    key={f.publicId}
                    icon="receipt"
                    title={formatFecha(f.fecha)}
                    subtitle={`${formatPesos(f.total)} · Plan ${PLANES[f.plan].nombre}${f.medioPago ? ` · ${f.medioPago}` : ''}`}
                    trailing={<Badge tono="success">Pagada</Badge>}
                    onClick={() => setFactura(f)}
                    aria-label={`Factura ${f.numero} del ${formatFecha(f.fecha)}`}
                  />
                ))}
              </List>
            )}
          </>
        )}
      </Page>

      <CambiarPlanSheet
        key={s?.plan ?? 'sin-plan'}
        open={cambiando}
        actual={s?.plan ?? null}
        onClose={() => setCambiando(false)}
        onContinuar={(plan) => {
          setCambiando(false);
          onPagar({ tipo: 'plan', plan });
        }}
      />
      <BottomSheet open={Boolean(factura)} title="Factura" onClose={() => setFactura(null)}>
        {factura && (
          <DataList
            items={[
              ['Número', factura.numero],
              ['Fecha', formatFecha(factura.fecha)],
              ['Plan', PLANES[factura.plan].nombre],
              ['Subtotal', formatPesos(factura.subtotal)],
              ['IVA 19 %', formatPesos(factura.iva)],
              ['Total', formatPesos(factura.total)],
              factura.medioPago ? ['Medio', factura.medioPago] : null,
              ['Referencia', factura.referencia],
            ]}
          />
        )}
      </BottomSheet>
    </>
  );
}
