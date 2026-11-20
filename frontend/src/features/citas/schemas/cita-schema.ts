import { z } from 'zod';
import { LIMITES, maximo } from '@/lib/validaciones';

/** Motivos rápidos del prototipo; «Otro» pide escribirlo */
export const MOTIVOS_CITA = [
  'Mantenimiento general',
  'Cambio de aceite',
  'Frenos',
  'Kit de arrastre',
  'Revisión eléctrica',
  'Otro',
] as const;

export type MotivoCita = (typeof MOTIVOS_CITA)[number];

/**
 * HU-59 · «Pedir cita». Con un motivo de la lista, la nota va como detalle (opcional);
 * con «Otro», la nota es el motivo y es obligatoria. Mismos largos que el backend.
 */
export const pedirCitaSchema = z
  .object({
    motoPublicId: z.string().min(1, 'Elige la moto'),
    fechaHora: z.string().min(1, 'Elige la hora'),
    motivo: z.enum(MOTIVOS_CITA, { error: 'Elige el motivo' }),
    nota: z.string().trim(),
    recordatorio: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.motivo === 'Otro') {
      if (!d.nota)
        ctx.addIssue({ code: 'custom', path: ['nota'], message: 'Cuéntanos qué necesitas' });
      else if (d.nota.length > LIMITES.motivoCita)
        ctx.addIssue({ code: 'custom', path: ['nota'], message: maximo(LIMITES.motivoCita) });
    } else if (d.nota.length > LIMITES.detalleCita) {
      ctx.addIssue({ code: 'custom', path: ['nota'], message: maximo(LIMITES.detalleCita) });
    }
  })
  .transform((d) => ({
    motoPublicId: d.motoPublicId,
    fechaHora: d.fechaHora,
    motivo: d.motivo === 'Otro' ? d.nota : d.motivo,
    detalle: d.motivo === 'Otro' || !d.nota ? undefined : d.nota,
    recordatorio: d.recordatorio,
  }));

export type PedirCitaValues = z.input<typeof pedirCitaSchema>;
