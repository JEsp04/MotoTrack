import { Prisma } from '../generated/prisma/client.js';

/** ¿El error es de un valor único repetido (P2002) en el campo indicado? */
export function esDuplicado(error: unknown, campo: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    JSON.stringify(error.meta ?? {}).includes(campo)
  );
}
