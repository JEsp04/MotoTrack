/**
 * Horario de atención para las citas (HU-57).
 *
 * - Las horas se manejan en hora de Colombia (UTC−5, sin horario de verano) y se guardan en UTC.
 * - Las citas se toman en bloques de 30 minutos: 8:00, 8:30, 9:00…
 * - Horario por defecto: lunes a viernes de 8:00 a 18:00, sábado de 8:00 a 12:00, domingo cerrado.
 * - Si el taller escribió su horario en `horarioAtencion` con un formato que se entiende,
 *   se usa ese (ver `leerHorario`). Si no se entiende, se usa el de por defecto.
 */

/** Minutos que dura cada bloque de la agenda */
export const BLOQUE_MIN = 30;

/** Colombia está siempre en UTC−5 */
const DESFASE_COLOMBIA_MIN = -5 * 60;

/** Apertura y cierre en minutos desde la medianoche (8:00 = 480). null = cerrado. */
export type Jornada = { abre: number; cierra: number } | null;

/** Índice 0 = domingo … 6 = sábado (igual que Date.getUTCDay) */
export type Horario = [Jornada, Jornada, Jornada, Jornada, Jornada, Jornada, Jornada];

const SEMANA: Jornada = { abre: 8 * 60, cierra: 18 * 60 };
export const HORARIO_POR_DEFECTO: Horario = [
  null,
  SEMANA,
  SEMANA,
  SEMANA,
  SEMANA,
  SEMANA,
  { abre: 8 * 60, cierra: 12 * 60 },
];

/** Para los mensajes: «los domingos», «los sábados» */
const DIAS_PLURAL = [
  'domingos',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábados',
] as const;

/** Nombres de día sin tildes, como se buscan en el texto del horario */
const DIAS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** «8:00 a. m.», «6 p. m.», «18:00», «12 m.» → minutos desde la medianoche */
const HORA = /(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|m\b\.?)?/g;

function aMinutos(h: string, m: string | undefined, sufijo: string | undefined) {
  let horas = Number(h);
  const minutos = Number(m ?? 0);
  const s = (sufijo ?? '').replace(/[\s.]/g, '');
  if (s === 'pm' && horas < 12) horas += 12;
  if (s === 'am' && horas === 12) horas = 0;
  if (horas > 24 || minutos > 59) return null;
  return horas * 60 + minutos;
}

/**
 * Lee un horario escrito por el taller. Entiende tramos separados por «;» o saltos de línea,
 * cada uno con días y dos horas, por ejemplo:
 *
 *   «Lunes a viernes, 8:00 a. m. a 6:00 p. m.; sábado, 8:00 a. m. a 12:00 m.»
 *   «Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00; domingo cerrado»
 *
 * Los días que no aparecen quedan cerrados. Si algún tramo no se entiende, devuelve null
 * (y se usa el horario por defecto).
 */
export function leerHorario(texto: string | null | undefined): Horario | null {
  if (!texto?.trim()) return null;
  const horario: Horario = [null, null, null, null, null, null, null];
  const tramos = sinTildes(texto)
    .split(/[;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tramos.length === 0) return null;

  for (const tramo of tramos) {
    const dias = diasDelTramo(tramo);
    if (dias.length === 0) return null;
    if (/cerrad/.test(tramo)) continue;

    const horas = [...tramo.matchAll(HORA)].map((m) => aMinutos(m[1]!, m[2], m[3]));
    if (horas.length !== 2 || horas.some((h) => h === null)) return null;
    const [abre, cierra] = horas as [number, number];
    if (cierra <= abre) return null;
    for (const d of dias) horario[d] = { abre, cierra };
  }
  return horario.some(Boolean) ? horario : null;
}

/** «lunes a viernes» → [1..5] · «lunes, miércoles y viernes» → [1, 3, 5] */
function diasDelTramo(tramo: string): number[] {
  const nombres = Object.keys(DIAS).join('|');
  const rango = new RegExp(`(${nombres})\\s+a\\s+(${nombres})`).exec(tramo);
  if (rango) {
    const desde = DIAS[rango[1]!]!;
    const hasta = DIAS[rango[2]!]!;
    const dias: number[] = [];
    for (let d = desde; ; d = (d + 1) % 7) {
      dias.push(d);
      if (d === hasta || dias.length === 7) break;
    }
    return dias;
  }
  return [...tramo.matchAll(new RegExp(nombres, 'g'))].map((m) => DIAS[m[0]]!);
}

export function horarioDelTaller(horarioAtencion: string | null | undefined): Horario {
  return leerHorario(horarioAtencion) ?? HORARIO_POR_DEFECTO;
}

// ─── Fechas en hora de Colombia ───────────────────────────────────────────

/** Partes de la fecha en hora de Colombia */
export function enColombia(fecha: Date) {
  const local = new Date(fecha.getTime() + DESFASE_COLOMBIA_MIN * 60_000);
  return {
    fecha: local.toISOString().slice(0, 10),
    diaSemana: local.getUTCDay(),
    minutos: local.getUTCHours() * 60 + local.getUTCMinutes(),
    /** Hay segundos o milisegundos sueltos (la hora no es exacta) */
    inexacta: local.getUTCSeconds() !== 0 || local.getUTCMilliseconds() !== 0,
  };
}

/** «2026-11-03» + 540 min (9:00 en Colombia) → Date en UTC */
export function desdeColombia(fecha: string, minutos: number) {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + (minutos - DESFASE_COLOMBIA_MIN) * 60_000);
}

/** 540 → «09:00» */
export const formatoHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

/** Todos los bloques del día según el horario (sin mirar cuáles están ocupados) */
export function bloquesDelDia(horario: Horario, fecha: string) {
  const jornada = horario[new Date(`${fecha}T00:00:00Z`).getUTCDay()];
  if (!jornada) return [];
  const bloques: Date[] = [];
  for (let m = jornada.abre; m + BLOQUE_MIN <= jornada.cierra; m += BLOQUE_MIN) {
    bloques.push(desdeColombia(fecha, m));
  }
  return bloques;
}

/**
 * Por qué no se puede tomar una cita a esa hora, o null si está dentro del horario.
 * Los mensajes dicen qué pasó y qué hacer.
 */
export function motivoFueraDeHorario(horario: Horario, fechaHora: Date): string | null {
  const { diaSemana, minutos, inexacta } = enColombia(fechaHora);
  const jornada = horario[diaSemana];
  if (!jornada) {
    return `El taller no atiende los ${DIAS_PLURAL[diaSemana]}. Elige otro día`;
  }
  if (minutos < jornada.abre || minutos + BLOQUE_MIN > jornada.cierra) {
    return `Esa hora está fuera del horario: los ${DIAS_PLURAL[diaSemana]} se atiende de ${formatoHora(jornada.abre)} a ${formatoHora(jornada.cierra)}`;
  }
  if ((minutos - jornada.abre) % BLOQUE_MIN !== 0 || inexacta) {
    return 'Las citas se toman cada 30 minutos (por ejemplo 9:00 o 9:30). Elige una de las horas libres';
  }
  return null;
}
