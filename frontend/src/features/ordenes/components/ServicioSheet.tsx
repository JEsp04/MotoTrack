import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Alert,
  Badge,
  BottomSheet,
  Button,
  EmptyState,
  Icon,
  Input,
  List,
  ListItem,
  Note,
  SkeletonList,
} from '@/components/ui';
import { useBuscarRepuestos } from '@/features/repuestos';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { Repuesto, ServicioCatalogo } from '@/types';
import { useAgregarServicio, useCatalogoServicios } from '../hooks/use-ordenes';
import {
  servicioSchema,
  type ServicioFormOutput,
  type ServicioFormValues,
} from '../schemas/orden-schemas';

interface Props {
  open: boolean;
  ordenPublicId: string;
  onClose: () => void;
}

type Elegido = { tipo: 'servicio'; item: ServicioCatalogo } | { tipo: 'repuesto'; item: Repuesto };

/** HU-33, HU-56 · Agregar un repuesto o servicio a la cotización; el total lo recalcula el backend */
export function ServicioSheet(props: Props) {
  return props.open ? <Formulario {...props} /> : null;
}

function stockBadge(r: Repuesto) {
  if (r.stock === 0) return <Badge tono="danger">Agotado</Badge>;
  if (r.critico) return <Badge tono="accent">Bajo</Badge>;
  return undefined;
}

function Formulario({ ordenPublicId, onClose }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState<Elegido | null>(null);
  const q = useDebounce(busqueda.trim(), 250);
  const catalogo = useCatalogoServicios();
  const repuestos = useBuscarRepuestos(q, true);
  const agregar = useAgregarServicio(ordenPublicId);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<ServicioFormValues, unknown, ServicioFormOutput>({
    resolver: zodResolver(servicioSchema),
    mode: 'onTouched',
    defaultValues: { cantidad: '1', precioUnitario: '' },
  });

  const cantidadTexto = useWatch({ control, name: 'cantidad' }) ?? '1';
  const cantidadNum = Number(cantidadTexto.replace(/\./g, '')) || 1;

  function seleccionar(opcion: Elegido) {
    setElegido(opcion);
    setErrorGeneral(null);
    reset({ cantidad: '1', precioUnitario: '' });
  }

  const onSubmit = handleSubmit(async (datos) => {
    if (!elegido) return;
    setErrorGeneral(null);
    try {
      await agregar.mutateAsync(
        elegido.tipo === 'repuesto'
          ? { repuestoPublicId: elegido.item.publicId, ...datos }
          : { servicioPublicId: elegido.item.publicId, ...datos },
      );
      toast(elegido.tipo === 'repuesto' ? 'Repuesto agregado' : 'Servicio agregado', 'success');
      onClose();
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  const termino = busqueda.trim().toLowerCase();
  const serviciosFiltrados = (catalogo.data ?? []).filter(
    (s) => !termino || s.nombre.toLowerCase().includes(termino),
  );
  const repuestosFiltrados = repuestos.data ?? [];
  const cargando =
    (repuestos.isPending && !repuestos.data) || (catalogo.isPending && !catalogo.data);
  const precioBase =
    elegido?.tipo === 'repuesto' ? elegido.item.precioVenta : elegido?.item.precioBase;
  const sinStockSuficiente = elegido?.tipo === 'repuesto' && cantidadNum > elegido.item.stock;

  return (
    <BottomSheet
      open
      title="Agregar a la cotización"
      onClose={onClose}
      footer={
        elegido ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="form-servicio" loading={agregar.isPending}>
              Agregar
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        )
      }
    >
      {!elegido ? (
        <div className="flex flex-col gap-3">
          <Input
            label="Buscar repuesto o servicio"
            hideLabel
            type="search"
            placeholder="Buscar repuesto o servicio"
            autoComplete="off"
            maxLength={LIMITES.busqueda}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {cargando ? (
            <SkeletonList rows={3} />
          ) : repuestos.isError && catalogo.isError ? (
            <Alert>{parseApiError(repuestos.error).message}</Alert>
          ) : repuestosFiltrados.length === 0 && serviciosFiltrados.length === 0 ? (
            <EmptyState
              icon="search"
              title="Sin resultados"
              text="No encontramos repuestos ni servicios con ese nombre."
            />
          ) : (
            <List label="Repuestos y servicios">
              {repuestosFiltrados.map((r) => (
                <ListItem
                  key={`rep-${r.publicId}`}
                  icon="box"
                  title={r.nombre}
                  subtitle={`Repuesto · ${formatPesos(r.precioVenta)} · ${r.stock > 0 ? `${r.stock} en stock` : 'Sin stock'}`}
                  trailing={stockBadge(r)}
                  onClick={() => seleccionar({ tipo: 'repuesto', item: r })}
                />
              ))}
              {serviciosFiltrados.map((s) => (
                <ListItem
                  key={`srv-${s.publicId}`}
                  icon="wrench"
                  title={s.nombre}
                  subtitle={`Servicio · ${formatPesos(s.precioBase)}`}
                  onClick={() => seleccionar({ tipo: 'servicio', item: s })}
                />
              ))}
            </List>
          )}
        </div>
      ) : (
        <form id="form-servicio" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {errorGeneral && <Alert>{errorGeneral}</Alert>}
          <div className="flex items-center gap-3 rounded-md bg-surface-sunken p-3.5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface text-ink"
              aria-hidden="true"
            >
              <Icon name={elegido.tipo === 'repuesto' ? 'box' : 'wrench'} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{elegido.item.nombre}</p>
              <p className="text-sm leading-5 text-ink-muted">
                {elegido.tipo === 'repuesto'
                  ? `Repuesto · ${formatPesos(elegido.item.precioVenta)} · ${elegido.item.stock > 0 ? `${elegido.item.stock} en stock` : 'Sin stock'}`
                  : `Servicio · ${formatPesos(elegido.item.precioBase)}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setElegido(null)}>
              Cambiar
            </Button>
          </div>
          {sinStockSuficiente && (
            <Note icon="alert" tono="accent">
              Stock disponible: {elegido.item.stock}. Si falta al iniciar la reparación, podrás
              pasar la orden a Falta repuesto.
            </Note>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad"
              inputMode="numeric"
              maxLength={2}
              error={errors.cantidad?.message}
              {...register('cantidad')}
            />
            <Input
              label="Precio unitario"
              inputMode="numeric"
              maxLength={11}
              placeholder={precioBase !== undefined ? String(precioBase) : undefined}
              hint={
                precioBase !== undefined
                  ? `${elegido.tipo === 'repuesto' ? 'Precio inventario' : 'Del catálogo'}: ${formatPesos(precioBase)}`
                  : 'En pesos'
              }
              error={errors.precioUnitario?.message}
              {...register('precioUnitario')}
            />
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
