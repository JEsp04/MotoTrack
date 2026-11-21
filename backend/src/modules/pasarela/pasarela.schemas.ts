import { z } from 'zod';
import { planSchema } from '../suscripcion/suscripcion.schemas.js';
import { luhn, marca, vigente } from './pasarela.tarjeta.js';

const tarjetaSchema = z.object({
  numero: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine(luhn, 'El número no es válido. Revísalo.')
    .refine((v) => marca(v) !== null, 'Aceptamos Visa, Mastercard, American Express y Diners.'),
  nombre: z.string().trim().min(4, 'Escribe el nombre como aparece en la tarjeta').max(80),
  vence: z.string().refine((v) => vigente(v), 'La tarjeta está vencida o la fecha no es válida.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Son 3 o 4 dígitos.'),
});

/** POST /api/pasarela/transacciones · «plan» cobra el plan; «metodo» solo cambia la tarjeta */
export const transaccionSchema = z.discriminatedUnion(
  'tipo',
  [
    z.object({
      tipo: z.literal('plan'),
      plan: planSchema,
      tarjeta: tarjetaSchema,
      autorizaCobroAutomatico: z.literal(true, {
        error: 'Autoriza el cobro automático para activar el plan',
      }),
    }),
    z.object({ tipo: z.literal('metodo'), tarjeta: tarjetaSchema }),
  ],
  { error: 'Indica si pagas un plan o cambias la tarjeta' },
);

export type TransaccionInput = z.infer<typeof transaccionSchema>;

/** Lo que firma la pasarela y luego confirma /api/suscripcion/pagos */
export const resultadoSchema = z.object({
  referencia: z.string().regex(/^MT-[A-Z0-9]{8}$/),
  taller: z.string(),
  tipo: z.enum(['plan', 'metodo']),
  plan: planSchema.nullable(),
  monto: z.number().int().min(0),
  medio: z.string().max(40),
  estado: z.enum(['aprobada', 'rechazada']),
  motivo: z.string().nullable(),
  fecha: z.iso.datetime(),
});

export type ResultadoPasarela = z.infer<typeof resultadoSchema>;
