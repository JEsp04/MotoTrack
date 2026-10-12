import { z } from 'zod';

/**
 * Validaciones de los formularios de auth.
 * Son las mismas reglas del backend (backend/src/modules/auth/auth.schemas.ts),
 * para avisar antes de enviar. El backend vuelve a validar siempre.
 */

const obligatorio = (campo: string) => z.string().trim().min(1, `${campo} es obligatorio`);

const email = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio')
  .pipe(z.email('Escribe un correo válido'));

const password = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres')
  .max(72, 'Admite máximo 72 caracteres')
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, 'Debe tener al menos una letra')
  .regex(/\d/, 'Debe tener al menos un número');

const soloDigitos = (v: string) => v.replace(/[\s-]/g, '');

const telefono = z
  .string()
  .trim()
  .min(1, 'El teléfono es obligatorio')
  .refine((v) => /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

const telefonoOpcional = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{10}$/.test(soloDigitos(v)), 'Debe tener 10 dígitos');

const documento = z
  .string()
  .trim()
  .min(1, 'El documento es obligatorio')
  .refine(
    (v) => /^[0-9A-Za-z]{5,20}$/.test(v.replace(/[\s.]/g, '')),
    'Escribe un documento válido, sin puntos',
  );

const confirmarClave = <T extends { password: string; confirmar: string }>(datos: T) =>
  datos.password === datos.confirmar;

// ─── Ingreso (HU-19) ────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
export type LoginForm = z.infer<typeof loginSchema>;

// ─── Registro de taller en 2 pasos (HU-20) ─────────────────────────────────

export const tallerPaso1Schema = z.object({
  nombre: obligatorio('El nombre del taller').max(150, 'Máximo 150 caracteres'),
  nit: z
    .string()
    .trim()
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[0-9-]*$/, 'Solo números y guion'),
  telefono,
  direccion: z.string().trim().max(255, 'Máximo 255 caracteres'),
});

export const adminPaso2Schema = z
  .object({
    nombre: obligatorio('Tu nombre').max(150, 'Máximo 150 caracteres'),
    email,
    telefono: telefonoOpcional,
    password,
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(confirmarClave, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });

export const registroTallerSchema = z.object({
  taller: tallerPaso1Schema,
  admin: adminPaso2Schema,
});
export type RegistroTallerForm = z.infer<typeof registroTallerSchema>;

// ─── Registro de cliente (HU-20) ───────────────────────────────────────────

export const registroClienteSchema = z
  .object({
    tallerId: z.string().min(1, 'Elige tu taller'),
    nombre: obligatorio('Tu nombre').max(150, 'Máximo 150 caracteres'),
    documentoIdentidad: documento,
    telefono,
    email,
    password,
    confirmar: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(confirmarClave, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });
export type RegistroClienteForm = z.infer<typeof registroClienteSchema>;
