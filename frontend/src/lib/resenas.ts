import type { EstadoResena } from '@/types';

/** HU-89 · Aspectos rápidos de la reseña (iguales a backend/src/modules/resenas/resenas.schemas.ts) */
export const ASPECTOS_RESENA = [
  'Buena atención',
  'Puntualidad',
  'Calidad del trabajo',
  'Precio justo',
  'Me explicaron todo',
  'Moto limpia',
] as const;

export const ESTADO_RESENA_LABEL: Record<EstadoResena, string> = {
  pendiente: 'Por revisar',
  revisada: 'Revisada',
  adaptada: 'Mejora adaptada',
};

/** 4.3 → «4,3» */
export const formatPromedio = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
