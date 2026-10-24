/**
 * Guardián del sistema de diseño.
 *
 * Falla si un componente:
 * - escribe un color a mano (hex, rgb, hsl, oklch…) fuera de src/styles/index.css,
 * - usa la paleta por defecto de Tailwind (bg-red-500, text-gray-700…) o un color arbitrario (bg-[#fff]),
 * - usa un token que no existe (text-primary-txt),
 * - o si alguien borra o renombra un token de color de index.css.
 *
 * Si de verdad hace falta un color nuevo: se agrega como token en index.css y se anota en TOKENS_BASE.
 * Para una excepción justificada, escribir `tokens-permitido` en esa línea con el motivo.
 *
 * Se corre con `npm test` (y en la revisión automática) o solo con `npm run check:tokens`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '..', 'src');
const INDEX_CSS = join(SRC, 'styles', 'index.css');

/** Tokens de color que ya usa la app. Borrarlos o renombrarlos rompe componentes. */
const TOKENS_BASE = [
  'primary',
  'on-primary',
  'accent',
  'accent-text',
  'accent-soft',
  'plate',
  'success',
  'success-text',
  'success-soft',
  'danger',
  'danger-text',
  'danger-soft',
  'bg',
  'surface',
  'surface-sunken',
  'surface-2',
  'ink',
  'ink-muted',
  'border',
  'border-strong',
];

/** Palabras de Tailwind que no son de la paleta y se pueden usar */
const COLORES_LIBRES = new Set(['white', 'black', 'transparent', 'current', 'inherit', 'none']);

const PALETA_TAILWIND =
  /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe)-(50|[1-9]00|950)$/;

/** Utilidades de Tailwind que reciben un color */
const PREFIJO_COLOR =
  /^-?(bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|divide|placeholder|accent|caret|decoration|shadow|inset-shadow|inset-ring)-(.+)$/;

/** Colores escritos a mano. `%23` es "#" dentro de un data URI (SVG en CSS). */
const COLOR_LITERAL =
  /(?:^|[\s'"`(:,[=])(#[0-9a-fA-F]{3,8}|%23[0-9a-fA-F]{3,8})(?![0-9a-zA-Z])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color-mix)\(/;

/** Colores con nombre de CSS en estilos en línea: style={{ color: 'red' }} */
const COLOR_CON_NOMBRE =
  /\b(?:color|background|backgroundColor|borderColor|outlineColor|fill|stroke)\s*:\s*['"](?!transparent|currentColor|inherit|none|var\()[a-zA-Z]+['"]/;

function tokensDeIndex(): string[] {
  const css = readFileSync(INDEX_CSS, 'utf8');
  return [...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]!);
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return [ruta];
  });
}

/** Componentes y código de la app (las pruebas y los datos de prueba no cuentan) */
const codigo = archivos(SRC).filter(
  (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.includes(`${join('src', 'test')}`),
);

/** Quita variantes (hover:, lg:, group-hover:…), "!" y la opacidad (/50) */
function utilidad(clase: string) {
  let base = clase;
  // El último ":" que no esté dentro de corchetes separa variantes de la utilidad
  let profundidad = 0;
  let corte = -1;
  for (let i = 0; i < base.length; i++) {
    const c = base[i];
    if (c === '[') profundidad++;
    else if (c === ']') profundidad--;
    else if (c === ':' && profundidad === 0) corte = i;
  }
  base = base.slice(corte + 1).replace(/^!/, '');
  return base;
}

function revisarClase(clase: string, tokens: Set<string>, familias: Set<string>): string | null {
  const m = PREFIJO_COLOR.exec(utilidad(clase));
  if (!m) return null;
  const valor = m[2]!.replace(/\/[\d.]+$|\/\[[^\]]+\]$/, '');

  if (valor.startsWith('[') || valor.startsWith('(')) {
    const interno = valor.slice(1, -1);
    const varToken = /^var\(--color-([a-z0-9-]+)\)$/.exec(interno);
    if (varToken) {
      return tokens.has(varToken[1]!)
        ? null
        : `«${clase}» usa --color-${varToken[1]}, que no existe en index.css`;
    }
    if (/#|rgb|hsl|oklch|oklab|color:|lab\(|lch\(/.test(interno)) {
      return `«${clase}» escribe un color a mano: usa un token de index.css`;
    }
    return null;
  }
  if (PALETA_TAILWIND.test(valor)) {
    return `«${clase}» usa la paleta por defecto de Tailwind: usa un token de index.css`;
  }
  if (tokens.has(valor) || COLORES_LIBRES.has(valor)) return null;
  // Empieza como un token (primary-…, ink-…) pero no existe: probablemente un error de escritura
  if (familias.has(valor.split('-')[0]!)) {
    return `«${clase}»: el token «${valor}» no existe en index.css`;
  }
  return null;
}

describe('Tokens del sistema de diseño (src/styles/index.css)', () => {
  const tokens = new Set(tokensDeIndex());
  const familias = new Set([...tokens].map((t) => t.split('-')[0]!));

  it('no se borró ni se renombró ningún token de color', () => {
    const faltan = TOKENS_BASE.filter((t) => !tokens.has(t));
    expect(faltan, `Tokens que faltan en index.css: ${faltan.join(', ')}`).toEqual([]);
  });

  it('los colores solo se definen en index.css', () => {
    const otrosCss = archivos(SRC).filter((f) => f.endsWith('.css') && f !== INDEX_CSS);
    const conColores = otrosCss.filter((f) => /--color-|@theme/.test(readFileSync(f, 'utf8')));
    expect(conColores.map((f) => relative(SRC, f))).toEqual([]);
  });

  it('ningún componente escribe colores a mano ni usa colores fuera de los tokens', () => {
    const errores: string[] = [];
    for (const archivo of codigo) {
      const lineas = readFileSync(archivo, 'utf8').split('\n');
      lineas.forEach((linea, i) => {
        if (linea.includes('tokens-permitido')) return;
        const donde = `${relative(SRC, archivo)}:${i + 1}`;
        if (COLOR_LITERAL.test(linea)) errores.push(`${donde} · color escrito a mano`);
        if (COLOR_CON_NOMBRE.test(linea)) errores.push(`${donde} · color con nombre en un estilo`);
        // Cada palabra dentro de comillas o plantillas puede ser una clase de Tailwind
        for (const texto of linea.match(/(['"`])(?:(?!\1).)*\1/g) ?? []) {
          for (const clase of texto.slice(1, -1).split(/\s+/)) {
            const error = clase && revisarClase(clase, tokens, familias);
            if (error) errores.push(`${donde} · ${error}`);
          }
        }
      });
    }
    expect(errores, `\n${errores.join('\n')}\n`).toEqual([]);
  });

  it('el revisor detecta los errores típicos (prueba del propio revisor)', () => {
    const revisar = (c: string) => revisarClase(c, tokens, familias);
    expect(revisar('bg-red-500')).toMatch(/paleta por defecto/);
    expect(revisar('hover:text-gray-700/80')).toMatch(/paleta por defecto/);
    expect(revisar('bg-[#ff0000]')).toMatch(/a mano/);
    expect(revisar('text-primary-txt')).toMatch(/no existe/);
    expect(revisar('border-[var(--color-inventado)]')).toMatch(/no existe/);
    for (const ok of [
      'bg-primary',
      'lg:hover:bg-primary/90',
      'text-on-primary',
      'border-border-strong/40',
      'ring-primary/40',
      'text-white/80',
      'bg-transparent',
      'text-sm',
      'border-b-3',
      'shadow-card',
      'bg-no-repeat',
      'outline-offset-4',
    ]) {
      expect(revisar(ok), ok).toBeNull();
    }
    expect(COLOR_LITERAL.test("style={{ color: '#fff' }}")).toBe(true);
    expect(COLOR_LITERAL.test('url("data:image/svg+xml,stroke=%235A6B7D")')).toBe(true);
    expect(COLOR_LITERAL.test('Orden #{orden.numero}')).toBe(false);
    expect(COLOR_CON_NOMBRE.test("style={{ backgroundColor: 'red' }}")).toBe(true);
  });
});
