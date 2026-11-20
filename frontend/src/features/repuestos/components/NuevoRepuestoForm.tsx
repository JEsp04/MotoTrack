import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  BottomSheet,
  Button,
  Card,
  Input,
  Page,
  QuantityStepper,
  Select,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { Repuesto } from '@/types';
import { useActualizarRepuesto, useCrearRepuesto } from '../hooks/use-repuestos';
import {
  calcularMargen,
  nuevoRepuestoSchema,
  type NuevoRepuestoOutput,
  type NuevoRepuestoValues,
} from '../schemas/repuesto-schema';
import { CATEGORIAS } from './categorias';

const FORM_ID = 'nuevo-repuesto';

/** Valores del formulario a partir de un repuesto guardado (HU-87) */
function valoresDe(r: Repuesto): NuevoRepuestoValues {
  return {
    nombre: r.nombre,
    referencia: r.referencia ?? '',
    categoria: r.categoria,
    precioVenta: String(r.precioVenta),
    costo: r.costo === null ? '' : String(r.costo),
    stock: r.stock,
    stockMinimo: r.stockMinimo,
    proveedor: r.proveedor ?? '',
    motosCompatibles: r.motosCompatibles ?? '',
  };
}

/**
 * HU-55 · «Repuesto nuevo» (NewPartScreen del prototipo):
 * nombre, referencia, categoría, precio de venta, costo con cálculo vivo de margen,
 * stock inicial, stock mínimo, proveedor y motos compatibles.
 * HU-87 · Con `repuesto`, el mismo formulario edita (`/admin/inventario/:id/editar`). El stock
 * no se edita aquí: cambia con un movimiento. Abajo está «Desactivar repuesto».
 */
export function NuevoRepuestoForm({ repuesto }: { repuesto?: Repuesto }) {
  const navigate = useNavigate();
  const crear = useCrearRepuesto();
  const actualizar = useActualizarRepuesto(repuesto?.publicId ?? '');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const editando = Boolean(repuesto);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NuevoRepuestoValues, unknown, NuevoRepuestoOutput>({
    resolver: zodResolver(nuevoRepuestoSchema),
    mode: 'onTouched',
    defaultValues: repuesto
      ? valoresDe(repuesto)
      : {
          nombre: '',
          referencia: '',
          categoria: 'otros',
          precioVenta: '',
          costo: '',
          stock: 0,
          stockMinimo: 1,
          proveedor: '',
          motosCompatibles: '',
        },
  });

  async function cambiarActivo() {
    if (!repuesto) return;
    try {
      await actualizar.mutateAsync({ activo: !repuesto.activo });
      toast(
        repuesto.activo
          ? `${repuesto.nombre} ya no aparece en el inventario. Su historial se conserva.`
          : `${repuesto.nombre} está activo de nuevo`,
        'success',
      );
      void navigate('/admin/inventario');
    } catch (error) {
      setConfirmando(false);
      setErrorGeneral(parseApiError(error).message);
    }
  }

  const [precioTexto = '', costoTexto = ''] = useWatch({
    control,
    name: ['precioVenta', 'costo'],
  });
  const margen = calcularMargen(precioTexto, costoTexto);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorGeneral(null);
    try {
      if (repuesto) {
        const guardado = await actualizar.mutateAsync({
          nombre: valores.nombre,
          referencia: valores.referencia || null,
          categoria: valores.categoria,
          precioVenta: valores.precioVenta,
          costo: valores.costo ?? null,
          stockMinimo: valores.stockMinimo,
          proveedor: valores.proveedor || null,
          motosCompatibles: valores.motosCompatibles || null,
        });
        toast(`Guardamos los cambios de ${guardado.nombre}`, 'success');
        void navigate('/admin/inventario');
        return;
      }
      const creado = await crear.mutateAsync({
        nombre: valores.nombre,
        referencia: valores.referencia || undefined,
        categoria: valores.categoria,
        precioVenta: valores.precioVenta,
        costo: valores.costo ?? null,
        stock: valores.stock,
        stockMinimo: valores.stockMinimo,
        proveedor: valores.proveedor || undefined,
        motosCompatibles: valores.motosCompatibles || undefined,
      });
      toast(`${creado.nombre} guardado`, 'success');
      void navigate('/admin/inventario');
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <>
      <AppBar
        title={editando ? 'Editar repuesto' : 'Repuesto nuevo'}
        subtitle="Inventario"
        onBack={() => void navigate(-1)}
      />
      <Page narrow pb="actionbar">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {errorGeneral && <Alert>{errorGeneral}</Alert>}

          <Input
            label="Nombre"
            required
            autoComplete="off"
            placeholder="Ej. Guaya de acelerador Pulsar NS200"
            maxLength={LIMITES.nombre}
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Referencia"
              hint="Opcional"
              autoComplete="off"
              placeholder="Ej. BJ-JF151030"
              maxLength={LIMITES.referencia}
              error={errors.referencia?.message}
              {...register('referencia')}
            />
            <Select
              label="Categoría"
              options={CATEGORIAS.map((c) => ({ value: c.id, label: c.label }))}
              error={errors.categoria?.message}
              {...register('categoria')}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Precio de venta"
              required
              inputMode="numeric"
              placeholder="28000"
              maxLength={11}
              error={errors.precioVenta?.message}
              {...register('precioVenta')}
            />
            <Input
              label="Costo"
              hint="Opcional"
              inputMode="numeric"
              placeholder="19000"
              maxLength={11}
              error={errors.costo?.message}
              {...register('costo')}
            />
          </div>

          {margen !== null && (
            <p className="-mt-2 text-sm leading-5 text-ink-muted">
              {'Margen: '}
              <span
                className={cn(
                  'font-semibold',
                  margen < 0
                    ? 'text-danger-text'
                    : margen < 15
                      ? 'text-accent-text'
                      : 'text-success-text',
                )}
              >
                {margen} %
              </span>
              {margen < 0
                ? ' · el costo supera al precio'
                : margen < 15
                  ? ' · bajo para un repuesto'
                  : ''}
            </p>
          )}

          <Card className="flex flex-col gap-3">
            {repuesto ? (
              <div>
                <p className="text-sm font-semibold text-ink">En stock: {repuesto.stock} und</p>
                <p className="text-sm leading-5 text-ink-muted">
                  El stock cambia con una entrada, salida o ajuste desde la hoja del repuesto.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Stock inicial</p>
                  <p className="text-sm leading-5 text-ink-muted">Unidades que tienes hoy</p>
                </div>
                <Controller
                  control={control}
                  name="stock"
                  render={({ field }) => (
                    <QuantityStepper
                      label="Stock inicial"
                      value={field.value}
                      min={0}
                      max={100_000}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Stock mínimo</p>
                <p className="text-sm leading-5 text-ink-muted">
                  Por debajo, se marca como crítico
                </p>
              </div>
              <Controller
                control={control}
                name="stockMinimo"
                render={({ field }) => (
                  <QuantityStepper
                    label="Stock mínimo"
                    value={field.value}
                    min={1}
                    max={100_000}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </Card>

          <Input
            label="Proveedor"
            hint="Opcional"
            autoComplete="off"
            placeholder="Ej. Distrimotos"
            maxLength={LIMITES.proveedor}
            error={errors.proveedor?.message}
            {...register('proveedor')}
          />

          <Input
            label="Motos compatibles"
            hint="Ayuda a sugerir el repuesto correcto en el diagnóstico."
            autoComplete="off"
            placeholder="Ej. Bajaj Pulsar NS200, NS160"
            maxLength={LIMITES.motosCompatibles}
            error={errors.motosCompatibles?.message}
            {...register('motosCompatibles')}
          />
        </form>

        {repuesto && (
          <Card title={repuesto.activo ? 'Desactivar repuesto' : 'Repuesto desactivado'}>
            <p className="mb-3 text-sm leading-5 text-ink-muted">
              {repuesto.activo
                ? 'Deja de aparecer en el inventario y al cotizar. Su historial de movimientos y órdenes se conserva.'
                : 'No aparece en el inventario ni al cotizar. Puedes activarlo de nuevo.'}
            </p>
            <Button
              variant="secondary"
              icon={repuesto.activo ? 'lock' : 'check'}
              fullWidth
              loading={!repuesto.activo && actualizar.isPending}
              onClick={() => (repuesto.activo ? setConfirmando(true) : void cambiarActivo())}
            >
              {repuesto.activo ? 'Desactivar repuesto' : 'Activar repuesto'}
            </Button>
          </Card>
        )}
      </Page>
      <ActionBar>
        <Button
          type="submit"
          form={FORM_ID}
          fullWidth
          icon="check"
          loading={crear.isPending || (actualizar.isPending && !confirmando)}
        >
          {editando ? 'Guardar cambios' : 'Guardar repuesto'}
        </Button>
      </ActionBar>

      {repuesto && (
        <BottomSheet
          open={confirmando}
          title="Desactivar repuesto"
          onClose={() => setConfirmando(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={actualizar.isPending}
                onClick={() => void cambiarActivo()}
              >
                Desactivar
              </Button>
            </>
          }
        >
          <p>
            <span className="font-semibold">{repuesto.nombre}</span> dejará de aparecer en el
            inventario y al cotizar. Su historial se conserva.
          </p>
        </BottomSheet>
      )}
    </>
  );
}
