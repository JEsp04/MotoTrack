import { useState } from 'react';
import {
  ActionBar,
  Alert,
  AppBar,
  Badge,
  Button,
  DataList,
  Icon,
  Input,
  Page,
  Spinner,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { formatFechaHora, formatPesos, hoyColombia } from '@/lib/format';
import type { PlanTaller, ResultadoPago } from '@/types';
import { usePagar } from '../hooks/use-suscripcion';
import { PLANES } from '../planes';
import { agruparNumero, formatoVence, luhn, marca, TARJETA_PRUEBA, vigente } from '../tarjeta';

/** El prototipo deja ver «Procesando pago…» un momento aunque la respuesta llegue antes */
const ESPERA_MINIMA_MS = 1200;

type Etapa = 'form' | 'procesando' | 'ok' | 'fallo';

export type PagoProps =
  | {
      tipo: 'plan';
      plan: PlanTaller;
      onBack: () => void;
      onTerminar: () => void;
    }
  | { tipo: 'metodo'; onBack: () => void; onTerminar: () => void };

/**
 * HU-81 · «Pago seguro» (CheckoutScreen del prototipo) con la pasarela simulada: solo tarjeta
 * (PSE y Nequi se omiten). «plan» cobra el plan; «metodo» cambia la tarjeta sin cobrar.
 * Tarjeta de prueba 4242…: aprobada. Terminada en 0002: rechazada.
 */
export function PagoSeguro(props: PagoProps) {
  const { tipo, onBack, onTerminar } = props;
  const plan = props.tipo === 'plan' ? PLANES[props.plan] : null;
  const total = plan?.precio ?? 0;
  const subtotal = Math.round(total / 1.19);
  const titulo = plan ? `Activar plan ${plan.nombre}` : 'Actualizar medio de pago';
  const concepto = plan ? `Plan ${plan.nombre} · mensual` : 'Nueva tarjeta para la suscripción';

  const [tarjeta, setTarjeta] = useState({ numero: '', nombre: '', vence: '', cvv: '' });
  const [autoriza, setAutoriza] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('form');
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pagar = usePagar();

  const num = tarjeta.numero.replace(/\D/g, '');
  const brand = marca(num);
  const errores = {
    numero:
      num.length >= 13 && !luhn(num)
        ? 'El número no es válido. Revísalo.'
        : num.length >= 13 && !brand
          ? 'Aceptamos Visa, Mastercard, American Express y Diners.'
          : undefined,
    vence:
      tarjeta.vence.length === 5 && !vigente(tarjeta.vence)
        ? 'La tarjeta está vencida o la fecha no es válida.'
        : undefined,
    cvv: tarjeta.cvv && !/^\d{3,4}$/.test(tarjeta.cvv) ? 'Son 3 o 4 dígitos.' : undefined,
  };
  const lista =
    luhn(num) &&
    Boolean(brand) &&
    tarjeta.nombre.trim().length > 3 &&
    vigente(tarjeta.vence) &&
    /^\d{3,4}$/.test(tarjeta.cvv) &&
    (tipo !== 'plan' || autoriza);

  const campo = (k: keyof typeof tarjeta) => (v: string) => setTarjeta((t) => ({ ...t, [k]: v }));

  async function enviar() {
    setError(null);
    setEtapa('procesando');
    const datos = { ...tarjeta, numero: num };
    const solicitud =
      props.tipo === 'plan'
        ? {
            tipo: 'plan' as const,
            plan: props.plan,
            tarjeta: datos,
            autorizaCobroAutomatico: true as const,
          }
        : { tipo: 'metodo' as const, tarjeta: datos };
    try {
      const [res] = await Promise.all([
        pagar.mutateAsync(solicitud),
        new Promise((r) => setTimeout(r, ESPERA_MINIMA_MS)),
      ]);
      setResultado(res);
      setEtapa(res.estado === 'aprobada' ? 'ok' : 'fallo');
    } catch (e) {
      setError(parseApiError(e).message);
      setEtapa('form');
    }
  }

  if (etapa === 'procesando') {
    return (
      <div
        role="status"
        className="mx-auto flex min-h-full w-full max-w-form flex-col items-center justify-center gap-6 bg-bg px-6 pt-8 pb-6 text-center"
      >
        <Spinner className="size-14 border-[5px] text-ink motion-reduce:[animation-duration:2.4s]" />
        <h1 className="text-[26px] leading-7 font-semibold tracking-[-0.03em]">Procesando pago…</h1>
        <p className="text-sm leading-5 text-ink-muted">
          No cierres esta ventana. Puede tardar unos segundos.
        </p>
      </div>
    );
  }

  if ((etapa === 'ok' || etapa === 'fallo') && resultado) {
    const ok = etapa === 'ok';
    return (
      <div className="mx-auto flex min-h-full w-full max-w-form flex-col justify-center gap-6 bg-bg px-6 pt-8 pb-6">
        <span
          aria-hidden="true"
          className={
            ok
              ? 'flex size-[72px] items-center justify-center rounded-full bg-ink text-accent'
              : 'flex size-[72px] items-center justify-center rounded-full bg-danger text-on-primary'
          }
        >
          <Icon name={ok ? 'check' : 'close'} size={34} stroke={3} />
        </span>
        <div>
          <h1 className="text-[26px] leading-7 font-semibold tracking-[-0.03em]">
            {ok ? (plan ? 'Pago aprobado' : 'Medio de pago actualizado') : 'Pago rechazado'}
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-ink-muted">
            {ok
              ? plan
                ? `Tu plan ${plan.nombre} está activo. La factura ya está en Taller y suscripción.`
                : 'Listo. La nueva tarjeta se usará desde el próximo cobro.'
              : resultado.motivo}
          </p>
        </div>
        <div className="rounded-md border border-dashed border-border-strong p-4">
          <DataList
            items={[
              ['Concepto', concepto],
              plan ? ['Valor', formatPesos(resultado.monto)] : null,
              ['Medio', resultado.medio],
              ['Referencia', resultado.referencia],
              ['Fecha', formatFechaHora(resultado.fecha)],
              [
                'Estado',
                <span className={ok ? 'text-success-text' : 'text-danger-text'}>
                  {ok ? 'Aprobado' : 'Rechazado'}
                </span>,
              ],
            ]}
          />
        </div>
        {ok ? (
          <Button fullWidth onClick={onTerminar}>
            Continuar
          </Button>
        ) : (
          <>
            <Button fullWidth onClick={() => setEtapa('form')}>
              {plan ? 'Intentar de nuevo' : 'Probar con otra tarjeta'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="min-h-11 text-sm font-semibold text-ink-muted underline underline-offset-4"
                onClick={onBack}
              >
                Cancelar y volver
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <AppBar title="Pago seguro" subtitle={titulo} onBack={onBack} />
      <Page narrow pb="actionbar" className="gap-4">
        <section aria-label="Resumen del pago" className="rounded-md bg-surface-sunken p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm leading-5 text-ink-muted">MotoTrack · suscripción mensual</p>
              <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">{concepto}</h2>
            </div>
            <Badge icon="lock">Pago seguro</Badge>
          </div>
          {plan ? (
            <>
              <div className="mt-3">
                <DataList
                  items={[
                    ['Subtotal', formatPesos(subtotal)],
                    ['IVA (19 %)', formatPesos(total - subtotal)],
                  ]}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-semibold">Total hoy</span>
                <span className="font-num text-2xl">{formatPesos(total)}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-ink-muted">
                Se renueva el {Number(hoyColombia().slice(8, 10))} de cada mes. Puedes cambiar de
                plan desde Taller y suscripción.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              No se hace ningún cobro ahora. La nueva tarjeta se usará desde el próximo cobro.
            </p>
          )}
        </section>

        {error && <Alert tono="danger">{error}</Alert>}

        <div
          aria-hidden="true"
          className="flex min-h-[170px] max-w-[360px] flex-col justify-between gap-[18px] rounded-[16px] bg-ink px-5 py-[18px] text-[13px] tracking-[0.04em] text-on-primary shadow-sheet"
        >
          <div className="flex items-center justify-between">
            <span className="block h-7 w-[38px] rounded-md bg-accent" />
            <b className="text-[15px] tracking-[0.02em]">{brand ?? 'Crédito o débito'}</b>
          </div>
          <div className="font-num text-base tracking-[0.08em]">
            {(num + '•'.repeat(Math.max(0, 16 - num.length))).replace(/(.{4})/g, '$1 ').trim()}
          </div>
          <div className="flex justify-between gap-3">
            <span className="truncate">
              {tarjeta.nombre.toUpperCase() || 'NOMBRE EN LA TARJETA'}
            </span>
            <span>{tarjeta.vence || 'MM/AA'}</span>
          </div>
        </div>

        <Input
          label="Número de la tarjeta"
          required
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={tarjeta.numero}
          onChange={(e) => campo('numero')(agruparNumero(e.target.value))}
          error={errores.numero}
        />
        <Input
          label="Nombre como aparece en la tarjeta"
          required
          autoComplete="cc-name"
          value={tarjeta.nombre}
          onChange={(e) => campo('nombre')(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Vence"
            required
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={tarjeta.vence}
            onChange={(e) => campo('vence')(formatoVence(e.target.value))}
            error={errores.vence}
          />
          <Input
            label="CVV"
            required
            inputMode="numeric"
            type="password"
            autoComplete="cc-csc"
            value={tarjeta.cvv}
            onChange={(e) => campo('cvv')(e.target.value.replace(/\D/g, '').slice(0, 4))}
            error={errores.cvv}
            hint="Atrás de la tarjeta"
          />
        </div>

        {tipo === 'plan' && (
          <label className="flex min-h-8 cursor-pointer items-start gap-3 text-sm leading-5">
            <input
              type="checkbox"
              className="peer sr-only"
              required
              checked={autoriza}
              onChange={(e) => setAutoriza(e.target.checked)}
            />
            <span
              aria-hidden="true"
              className="flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 border-border-strong bg-surface text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
            >
              <Icon name="check" size={14} stroke={3} />
            </span>
            <span>
              Autorizo el cobro automático de {formatPesos(total)} cada mes a esta tarjeta.
            </span>
          </label>
        )}

        <button
          type="button"
          className="min-h-9 self-start text-sm font-semibold underline underline-offset-4"
          onClick={() => setTarjeta(TARJETA_PRUEBA)}
        >
          Demo: usar tarjeta de prueba
        </button>
        <p className="text-sm leading-5 text-ink-muted">
          Demo: una tarjeta terminada en 0002 (4000 0000 0000 0002) muestra el pago rechazado.
        </p>

        <div className="flex items-start gap-2.5 rounded-sm border border-dashed border-border-strong px-3.5 py-3 text-[13px] leading-[19px] text-ink-muted">
          <Icon name="lock" size={18} className="shrink-0 text-success-text" />
          <span>
            Pago de prueba: no se cobra nada. MotoTrack nunca guarda el número completo de tu
            tarjeta ni el CVV.
          </span>
        </div>
      </Page>
      <ActionBar>
        <Button icon="lock" disabled={!lista} onClick={() => void enviar()}>
          {tipo === 'metodo' ? 'Guardar tarjeta' : `Pagar ${formatPesos(total)}`}
        </Button>
      </ActionBar>
    </>
  );
}
