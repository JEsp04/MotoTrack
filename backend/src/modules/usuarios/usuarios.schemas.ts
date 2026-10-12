import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  telefonoEditable,
  telefonoOpcional,
  texto,
} from '../../utils/schemas.js';

/** POST /api/usuarios (HU-23). El rol siempre es mecánico y el taller el del admin. */
export const crearMecanicoSchema = z.object({
  nombre: texto('El nombre', 150),
  email: emailSchema,
  telefono: telefonoOpcional,
  /** Contraseña temporal que el admin le entrega al mecánico */
  password: passwordSchema,
});

/** PATCH /api/usuarios/:id · Datos básicos o activar / desactivar */
export const actualizarMecanicoSchema = z
  .object({
    nombre: texto('El nombre', 150).optional(),
    telefono: telefonoEditable,
    estado: z
      .enum(['activo', 'inactivo'], { error: 'El estado debe ser activo o inactivo' })
      .optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

export const listarUsuariosSchema = z.object({
  rol: z.enum(['admin', 'mecanico'], { error: 'El rol debe ser admin o mecanico' }).optional(),
});

export type CrearMecanicoInput = z.infer<typeof crearMecanicoSchema>;
export type ActualizarMecanicoInput = z.infer<typeof actualizarMecanicoSchema>;
