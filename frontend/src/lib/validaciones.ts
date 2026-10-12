import { z } from 'zod';

/**
 * Reglas de validación compartidas por los formularios.
 * Son las mismas del backend (backend/src/utils/schemas.ts) para avisar antes de enviar;
 * el backend vuelve a validar siempre.
 */

/**
 * Largo máximo de cada campo. Es el mismo del backend y de la base de datos,
 * y se usa también como `maxLength` en los inputs para que no se pueda escribir de más.
 */
export const LIMITES = {
  nombre: 150,
  email: 150,
  password: 72,
  telefono: 20,
  documento: 30,
  nit: 20,
  direccion: 255,
  placa: 10,
  marca: 80,
  referencia: 80,
  color: 40,
  busqueda: 100,
} as const;

export const maximo = (max: number) => `Máximo ${max} caracteres`;

export const obligatorio = (campo: string) => z.string().trim().min(1, `${campo} es obligatorio`);

export const email = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .max(LIMITES.email, maximo(LIMITES.email))
  .pipe(z.email('Escribe un correo válido'));

/** Correo que se puede dejar vacío */
export const emailOpcional = z
  .string()
  .trim()
  .max(LIMITES.email, maximo(LIMITES.email))
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Escribe un correo válido');

export const password = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .max(LIMITES.password, maximo(LIMITES.password))
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'Debe tener al menos una letra')
  .regex(/\d/, 'Debe tener al menos un número');

const soloDigitos = (v: string) => v.replace(/[\s-]/g, '');

export const telefono = z
  .string()
  .trim()
  .min(1, 'El teléfono es obligatorio')
  .max(LIMITES.telefono, maximo(LIMITES.telefono))
  .refine((v) => /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

export const telefonoOpcional = z
  .string()
  .trim()
  .max(LIMITES.telefono, maximo(LIMITES.telefono))
  .refine((v) => v === '' || /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

export const documento = z
  .string()
  .trim()
  .min(1, 'El documento es obligatorio')
  .max(LIMITES.documento, maximo(LIMITES.documento))
  .refine(
    (v) => /^[0-9A-Za-z]{5,20}$/.test(v.replace(/[\s.]/g, '')),
    'Escribe un documento válido, sin puntos',
  );

/** Placa en mayúsculas y sin espacios ni guiones: "abc 12d" → "ABC12D" */
export const normalizarPlaca = (v: string) => v.replace(/[\s-]/g, '').toUpperCase();

/** Placa colombiana de moto: ABC12D, o la antigua ABC12 */
export const placa = z
  .string()
  .trim()
  .min(1, 'La placa es obligatoria')
  .max(LIMITES.placa, maximo(LIMITES.placa))
  .refine(
    (v) => /^[A-Z]{3}\d{2}[A-Z]?$/.test(normalizarPlaca(v)),
    'Escribe una placa válida, por ejemplo ABC12D',
  );

/** Número escrito en un input: "" → undefined; si no es un entero, el mensaje indicado */
export const enteroDesdeTexto = (mensaje: string) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/\./g, ''))
    .refine((v) => v === '' || /^\d+$/.test(v), mensaje)
    .transform((v) => (v === '' ? undefined : Number(v)));
