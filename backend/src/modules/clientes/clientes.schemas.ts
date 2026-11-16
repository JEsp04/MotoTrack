import { z } from 'zod';
import {
  busquedaSchema,
  documentoSchema,
  emailEditable,
  emailOpcional,
  paginacionSchema,
  telefonoSchema,
  texto,
  textoEditable,
  textoOpcional,
} from '../../utils/schemas.js';

/** POST /api/clientes (HU-24). El taller siempre es el del admin. */
export const crearClienteSchema = z.object({
  nombre: texto('El nombre', 150),
  documentoIdentidad: documentoSchema,
  telefono: telefonoSchema,
  email: emailOpcional,
  direccion: textoOpcional('La dirección', 255),
});

/** PATCH /api/clientes/:id (HU-25). El documento no se cambia. */
export const actualizarClienteSchema = z
  .object({
    nombre: texto('El nombre', 150).optional(),
    telefono: telefonoSchema.optional(),
    email: emailEditable,
    direccion: textoEditable('La dirección', 255),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), 'No enviaste nada para cambiar');

/** GET /api/clientes?q=&page=&limit= · q busca en nombre, documento, teléfono y placa */
export const listarClientesSchema = paginacionSchema.extend({ q: busquedaSchema });

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
export type ListarClientesQuery = z.infer<typeof listarClientesSchema>;
