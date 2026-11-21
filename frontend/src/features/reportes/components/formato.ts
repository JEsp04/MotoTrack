import { formatPesos } from '@/lib/format';

const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** Ingresos abreviados como en el prototipo: 18.400.000 → «18,4 M»; 850.000 → «850 mil» */
export function abreviarPesos(valor: number): string {
  if (valor >= 1_000_000) return `${decimal.format(valor / 1_000_000)} M`;
  if (valor >= 1_000) return `${decimal.format(Math.round(valor / 1_000))} mil`;
  return formatPesos(valor).replace('$ ', '');
}

/** «+12 % vs. octubre», «−5 % vs. semana ant.» o «Sin ingresos en octubre» */
export function comparacion(variacion: number | null, nombre: string): string {
  if (variacion === null) return `Sin ingresos en ${nombre}`;
  const signo = variacion > 0 ? '+' : variacion < 0 ? '−' : '';
  return `${signo}${Math.abs(variacion)} % vs. ${nombre}`;
}

/** 1.8 → «1,8» */
export function formatDias(dias: number | null): string {
  return dias === null ? '—' : decimal.format(dias);
}
