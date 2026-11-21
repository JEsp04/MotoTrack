/**
 * HU-75 · Reglas fijas de mantenimiento preventivo (sin IA). Para cambiarlas basta con editar
 * este archivo: cada regla se reconoce por palabras en el nombre del servicio del catálogo.
 *
 * Una moto cumple el intervalo cuando, desde la última orden entregada con ese servicio,
 * recorrió `cadaKm` o pasaron `cadaMeses` (lo que ocurra primero).
 */
export interface ReglaMantenimiento {
  id: string;
  /** Título del recordatorio */
  titulo: string;
  /** Para el «Por qué:», en minúscula: «último cambio de aceite» */
  ultimo: string;
  /** Palabras (sin tildes, en minúscula) que debe tener el nombre del servicio */
  palabras: string[];
  cadaKm: number;
  cadaMeses: number;
}

export const REGLAS: ReglaMantenimiento[] = [
  {
    id: 'aceite',
    titulo: 'Cambio de aceite',
    ultimo: 'último cambio de aceite',
    palabras: ['aceite'],
    cadaKm: 3_000,
    cadaMeses: 3,
  },
  {
    id: 'frenos',
    titulo: 'Revisión de pastillas de freno',
    ultimo: 'última revisión de frenos',
    palabras: ['pastilla', 'freno'],
    cadaKm: 15_000,
    cadaMeses: 12,
  },
  {
    id: 'arrastre',
    titulo: 'Ajuste de kit de arrastre',
    ultimo: 'último ajuste del kit de arrastre',
    palabras: ['arrastre', 'cadena'],
    cadaKm: 8_000,
    cadaMeses: 6,
  },
];

/** «Cambio de Aceite 20W-50» → «cambio de aceite 20w-50» (sin tildes) */
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/** Las reglas que aplican a un servicio por su nombre */
export function reglasDeServicio(nombre: string) {
  const n = normalizar(nombre);
  return REGLAS.filter((r) => r.palabras.some((p) => n.includes(p)));
}

export const reglaPorId = (id: string) => REGLAS.find((r) => r.id === id);

/** Motivos para rechazar un recordatorio (los del prototipo) */
export const MOTIVOS_RECHAZO = [
  'El servicio ya se hizo',
  'No aplica para esta moto',
  'El cliente no quiere recordatorios',
  'Otro motivo',
] as const;
