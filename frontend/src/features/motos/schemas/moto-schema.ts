import { z } from 'zod';
import {
  enteroDesdeTexto,
  LIMITES,
  maximo,
  normalizarPlaca,
  obligatorio,
  placa,
} from '@/lib/validaciones';
import type { Moto } from '@/types';

export const anioMaximo = () => new Date().getFullYear() + 1;

/**
 * Formulario de moto (HU-26). Los números se escriben como texto y se convierten al enviar.
 * Mismas reglas del backend: placa colombiana, año hasta el próximo, cilindraje 50–3000.
 */
export const motoSchema = z.object({
  placa: placa.transform(normalizarPlaca),
  marca: obligatorio('La marca').max(LIMITES.marca, maximo(LIMITES.marca)),
  referencia: obligatorio('La referencia').max(LIMITES.referencia, maximo(LIMITES.referencia)),
  modelo: enteroDesdeTexto('Escribe el año, por ejemplo 2022')
    .refine((v) => v !== undefined, 'El modelo (año) es obligatorio')
    .refine((v) => v === undefined || v >= 1950, 'El modelo debe ser desde 1950')
    .refine((v) => v === undefined || v <= anioMaximo(), {
      error: () => `El modelo no puede ser mayor a ${anioMaximo()}`,
    })
    .transform((v) => v!),
  cilindraje: enteroDesdeTexto('Escribe solo números')
    .refine((v) => v === undefined || (v >= 50 && v <= 3000), 'Entre 50 y 3000 cc')
    .transform((v) => v ?? null),
  color: z
    .string()
    .trim()
    .max(LIMITES.color, maximo(LIMITES.color))
    .transform((v) => v || null),
  kilometraje: enteroDesdeTexto('Escribe solo números')
    .refine((v) => v === undefined || v <= 2_000_000, 'Revisa el kilometraje')
    .transform((v) => v ?? 0),
});

export type MotoFormValues = z.input<typeof motoSchema>;
export type MotoFormOutput = z.output<typeof motoSchema>;

export const MOTO_VACIA: MotoFormValues = {
  placa: '',
  marca: '',
  referencia: '',
  modelo: '',
  cilindraje: '',
  color: '',
  kilometraje: '',
};

/** Valores del formulario a partir de una moto guardada (para editar) */
export function valoresDeMoto(moto: Moto): MotoFormValues {
  return {
    placa: moto.placa,
    marca: moto.marca,
    referencia: moto.referencia,
    modelo: String(moto.modelo),
    cilindraje: moto.cilindraje ? String(moto.cilindraje) : '',
    color: moto.color ?? '',
    kilometraje: String(moto.kilometraje),
  };
}
