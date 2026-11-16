import { z } from 'zod';
import {
  documento,
  emailOpcional,
  LIMITES,
  maximo,
  obligatorio,
  telefono,
} from '@/lib/validaciones';

/** HU-24 · Mismas reglas del backend. El correo y la dirección son opcionales. */
export const clienteSchema = z.object({
  nombre: obligatorio('El nombre').max(LIMITES.nombre, maximo(LIMITES.nombre)),
  documentoIdentidad: documento,
  telefono,
  email: emailOpcional,
  direccion: z.string().trim().max(LIMITES.direccion, maximo(LIMITES.direccion)),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;

export const CLIENTE_VACIO: ClienteFormValues = {
  nombre: '',
  documentoIdentidad: '',
  telefono: '',
  email: '',
  direccion: '',
};
