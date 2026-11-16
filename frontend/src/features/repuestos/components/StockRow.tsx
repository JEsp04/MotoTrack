import { Icon, LeadIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPesos } from '@/lib/format';
import type { Repuesto } from '@/types';
import { CATEGORIA_LABEL } from './categorias';

/**
 * HU-54 · Fila de un repuesto en el inventario (StockRow del prototipo):
 * nombre, categoría y precio, barra de stock y alerta de stock crítico.
 */
export function StockRow({ repuesto, onClick }: { repuesto: Repuesto; onClick: () => void }) {
  const pct = Math.min(
    100,
    Math.round((repuesto.stock / Math.max(repuesto.stockMinimo * 2, 1)) * 100),
  );

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left text-ink transition-colors duration-150 hover:bg-surface-2"
      >
        <LeadIcon icon="box" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{repuesto.nombre}</span>
          <span className="block truncate text-sm leading-5 text-ink-muted">
            {CATEGORIA_LABEL[repuesto.categoria]} · {formatPesos(repuesto.precioVenta)}
            {repuesto.critico && (
              <>
                {' · '}
                <span className="font-semibold text-accent-text">Stock crítico</span>
              </>
            )}
          </span>
        </span>
        <span className="flex w-[88px] shrink-0 flex-col gap-1 text-right">
          <span
            className={cn(
              'inline-flex items-center justify-end gap-1 text-sm font-semibold',
              repuesto.critico ? 'text-accent-text' : 'text-ink',
            )}
          >
            {repuesto.critico && <Icon name="alert" size={14} />}
            {repuesto.stock} und
          </span>
          <span
            role="meter"
            aria-valuenow={repuesto.stock}
            aria-valuemin={0}
            aria-label="Stock"
            className="block h-1.5 overflow-hidden rounded-[3px] bg-surface-2"
          >
            <span
              className={cn(
                'block h-full rounded-[3px]',
                repuesto.critico ? 'bg-accent' : 'bg-success',
              )}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="text-xs leading-4 text-ink-muted">mín. {repuesto.stockMinimo}</span>
        </span>
      </button>
    </li>
  );
}
