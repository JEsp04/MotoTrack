import { randomInt } from 'node:crypto';

/** Código de retiro de 4 dígitos (HU-66), por ejemplo «0427». */
export function nuevoCodigoRetiro(): string {
  return randomInt(0, 10_000).toString().padStart(4, '0');
}
