import { z } from 'zod';

/**
 * Reglas de validación compartidas por todos los módulos.
 * El largo máximo de cada texto es el mismo de su columna en la base de datos.
 */

export const texto = (campo: string, max: number) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `${campo} admite máximo ${max} caracteres`);

/** Texto opcional: '' o null se guardan como null */
export const textoOpcional = (campo: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${campo} admite máximo ${max} caracteres`)
    .nullish()
    .transform((v) => v || null);

export const emailSchema = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Escribe un correo válido').max(150, 'El correo admite máximo 150 caracteres'));

/** Correo opcional: '' o null se guardan como null */
export const emailOpcional = z
  .union([z.literal(''), z.null(), emailSchema])
  .optional()
  .transform((v) => v || null);

/** Mínimo 8 caracteres, con al menos una letra y un número */
export const passwordSchema = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña admite máximo 72 caracteres')
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'La contraseña debe tener al menos una letra')
  .regex(/\d/, 'La contraseña debe tener al menos un número');

/** Celular o fijo colombiano: 10 dígitos (se ignoran espacios y guiones) */
export const telefonoSchema = z
  .string({ error: 'El teléfono es obligatorio' })
  .max(20, 'El teléfono admite máximo 20 caracteres')
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'));

/** Teléfono opcional: '' o null se guardan como null */
export const telefonoOpcional = z
  .union([z.literal(''), z.null(), telefonoSchema])
  .optional()
  .transform((v) => v || null);

export const documentoSchema = z
  .string({ error: 'El documento es obligatorio' })
  .max(30, 'El documento admite máximo 30 caracteres')
  .transform((v) => v.replace(/[\s.]/g, ''))
  .pipe(z.string().regex(/^[0-9A-Za-z]{5,20}$/, 'Escribe un documento válido, sin puntos'));

// ─── Para PATCH: campo ausente = no cambia; '' o null = se borra ──────────

const vacioANull = z.union([z.literal(''), z.null()]).transform(() => null);

export const telefonoEditable = z.union([vacioANull, telefonoSchema]).optional();
export const emailEditable = z.union([vacioANull, emailSchema]).optional();
export const textoEditable = (campo: string, max: number) =>
  z
    .union([
      vacioANull,
      z
        .string()
        .trim()
        .max(max, `${campo} admite máximo ${max} caracteres`)
        .transform((v) => v || null),
    ])
    .optional();

/** ?page=&limit= · Por defecto 20 por página, máximo 50 */
export const paginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Texto de búsqueda (?q=). Vacío = sin filtro */
export const busquedaSchema = z
  .string()
  .trim()
  .max(100, 'La búsqueda admite máximo 100 caracteres')
  .optional()
  .transform((v) => v || undefined);

/** :id de las rutas. Es el publicId (UUID); si no tiene ese formato, el recurso no existe. */
export const esPublicId = (valor: unknown): valor is string => z.uuid().safeParse(valor).success;
