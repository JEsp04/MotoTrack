import type { CategoriaRepuesto, TipoMovimientoStock } from '@/types';

export const CATEGORIA_LABEL: Record<CategoriaRepuesto, string> = {
  aceites: 'Aceites',
  frenos: 'Frenos',
  filtros: 'Filtros',
  transmision: 'Transmisión',
  electrico: 'Eléctrico',
  llantas: 'Llantas',
  otros: 'Otros',
};

export const CATEGORIAS: Array<{ id: CategoriaRepuesto; label: string }> = [
  { id: 'aceites', label: CATEGORIA_LABEL.aceites },
  { id: 'frenos', label: CATEGORIA_LABEL.frenos },
  { id: 'filtros', label: CATEGORIA_LABEL.filtros },
  { id: 'transmision', label: CATEGORIA_LABEL.transmision },
  { id: 'electrico', label: CATEGORIA_LABEL.electrico },
  { id: 'llantas', label: CATEGORIA_LABEL.llantas },
  { id: 'otros', label: CATEGORIA_LABEL.otros },
];

export const TIPO_MOVIMIENTO_LABEL: Record<TipoMovimientoStock, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};
