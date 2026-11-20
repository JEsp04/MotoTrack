import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  BottomSheet,
  Button,
  DataList,
  Input,
  List,
  ListItem,
  QuantityStepper,
  Segmented,
  SkeletonList,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { formatFecha, formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { MovimientoStock, Repuesto, TipoMovimientoStock } from '@/types';
import { useRegistrarMovimiento, useRepuesto } from '../hooks/use-repuestos';
import { TIPO_MOVIMIENTO_LABEL } from './categorias';

interface Props {
  repuesto: Repuesto | null;
  soloLectura: boolean;
  onClose: () => void;
}

/**
 * HU-54 · Hoja inferior de un repuesto con stock, movimiento rápido y últimos movimientos.
 * HU-87 · Muestra precio, referencia, proveedor y motos compatibles (costo y margen solo al
 * admin), el botón «Editar repuesto» y el campo «Referencia o motivo» del movimiento.
 */
export function RepuestoSheet({ repuesto, soloLectura, onClose }: Props) {
  if (!repuesto) return null;
  return (
    <ContenidoSheet
      key={repuesto.publicId}
      repuestoInicial={repuesto}
      soloLectura={soloLectura}
      onClose={onClose}
    />
  );
}

function tituloMovimiento(mv: MovimientoStock) {
  const label = TIPO_MOVIMIENTO_LABEL[mv.tipo];
  if (mv.tipo === 'ajuste') return `${label} · quedó en ${mv.stockResultante} und`;
  return `${label} · ${mv.cantidad} und`;
}

function ContenidoSheet({
  repuestoInicial,
  soloLectura,
  onClose,
}: {
  repuestoInicial: Repuesto;
  soloLectura: boolean;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<TipoMovimientoStock>('entrada');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const detalle = useRepuesto(repuestoInicial.publicId);
  const mover = useRegistrarMovimiento(repuestoInicial.publicId);

  const repuesto = detalle.data ?? repuestoInicial;
  const movimientos = detalle.data?.movimientos ?? [];
  const sugerido = Math.max(repuesto.stockMinimo * 2 - repuesto.stock, 1);
  const min = tipo === 'ajuste' ? 0 : 1;
  const salidaMayor = tipo === 'salida' && cantidad > repuesto.stock;

  function cambiarTipo(nuevo: TipoMovimientoStock) {
    setTipo(nuevo);
    setError(null);
    // En un ajuste se parte del stock actual: solo se corrige lo que se contó
    if (nuevo === 'ajuste') setCantidad(repuesto.stock);
    else if (tipo === 'ajuste' || cantidad < 1) setCantidad(1);
  }

  async function guardar() {
    if (salidaMayor) return;
    setError(null);
    try {
      await mover.mutateAsync({ tipo, cantidad, referencia: motivo.trim() || undefined });
      toast(`${TIPO_MOVIMIENTO_LABEL[tipo]} de ${cantidad} registrada`, 'success');
      onClose();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <BottomSheet
      open
      title={repuesto.nombre}
      onClose={onClose}
      footer={
        soloLectura ? undefined : (
          <Button
            variant={tipo === 'entrada' ? 'primary' : 'secondary'}
            icon={tipo === 'entrada' ? 'arrowDown' : 'arrowUp'}
            disabled={salidaMayor || mover.isPending}
            loading={mover.isPending}
            onClick={() => void guardar()}
          >
            {`Registrar ${tipo} de ${cantidad}`}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-surface-sunken p-4">
          <p className="text-sm leading-5 text-ink-muted">En stock</p>
          <p
            className={cn('font-num text-[22px] leading-7', repuesto.critico && 'text-accent-text')}
          >
            {repuesto.stock}
          </p>
        </div>
        <div className="rounded-md bg-surface-sunken p-4">
          <p className="text-sm leading-5 text-ink-muted">Stock mínimo</p>
          <p className="font-num text-[22px] leading-7">{repuesto.stockMinimo}</p>
        </div>
      </div>

      <DataList
        items={[
          ['Precio de venta', formatPesos(repuesto.precioVenta)],
          !soloLectura && [
            'Costo',
            repuesto.costo === null ? 'Sin costo' : formatPesos(repuesto.costo),
          ],
          !soloLectura && repuesto.margen !== null && ['Margen', `${repuesto.margen} %`],
          ['Referencia', repuesto.referencia ?? 'Sin referencia'],
          ['Proveedor', repuesto.proveedor ?? 'Sin proveedor'],
          ['Motos compatibles', repuesto.motosCompatibles ?? 'Sin registrar'],
        ]}
      />

      {!soloLectura && (
        <Button
          variant="secondary"
          icon="edit"
          onClick={() => void navigate(`/admin/inventario/${repuesto.publicId}/editar`)}
        >
          Editar repuesto
        </Button>
      )}

      {repuesto.critico && (
        <div className="rounded-sm bg-accent-soft px-3 py-2 text-sm leading-5 text-accent-text">
          <span className="font-semibold">Stock crítico. </span>
          Sugerido pedir {sugerido} {sugerido === 1 ? 'unidad' : 'unidades'}.
        </div>
      )}

      {!soloLectura && (
        <>
          <Segmented
            label="Tipo de movimiento"
            value={tipo}
            onChange={cambiarTipo}
            options={[
              { id: 'entrada', label: 'Entrada' },
              { id: 'salida', label: 'Salida' },
              { id: 'ajuste', label: 'Ajuste' },
            ]}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">
              {tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
            </span>
            <QuantityStepper
              label={tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
              value={cantidad}
              min={min}
              max={100_000}
              onChange={setCantidad}
            />
          </div>
          {tipo === 'ajuste' && (
            <p className="text-sm leading-5 text-ink-muted">
              Escribe las unidades que contaste: ese número queda como el nuevo stock total (hoy hay{' '}
              {repuesto.stock}).
            </p>
          )}
          <Input
            label="Referencia o motivo"
            hint="Opcional. Ej. Factura 1234 o conteo de fin de mes"
            autoComplete="off"
            maxLength={150}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {salidaMayor && (
            <p className="text-sm leading-5 text-danger-text">
              No hay suficientes unidades (disponibles: {repuesto.stock}).
            </p>
          )}
          {error && <Alert>{error}</Alert>}
        </>
      )}

      <div>
        <p className="mb-1.5 text-sm font-semibold">Últimos movimientos</p>
        {detalle.isPending && !detalle.data ? (
          <SkeletonList rows={2} />
        ) : detalle.isError ? (
          <Alert>{parseApiError(detalle.error).message}</Alert>
        ) : movimientos.length === 0 ? (
          <p className="text-sm leading-5 text-ink-muted">Sin movimientos registrados.</p>
        ) : (
          <List label="Últimos movimientos">
            {movimientos.slice(0, 3).map((mv) => (
              <ListItem
                key={mv.publicId}
                icon={mv.tipo === 'entrada' ? 'arrowDown' : 'arrowUp'}
                title={tituloMovimiento(mv)}
                subtitle={
                  mv.referencia || (mv.orden ? `Orden #${mv.orden.numero}` : mv.usuario.nombre)
                }
                chevron={false}
                trailing={
                  <span className="text-xs text-ink-muted">
                    {formatFecha(mv.creadoEn).replace(/ de \d{4}$/, '')}
                  </span>
                }
              />
            ))}
          </List>
        )}
      </div>
    </BottomSheet>
  );
}
