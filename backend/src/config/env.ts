import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().startsWith('mysql://', 'Debe empezar por mysql://'),
  JWT_ACCESS_SECRET: z.string().min(32, 'Debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // HU-79 · Asistente IA. Sin llave, el asistente queda apagado y la app funciona igual.
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  ANTHROPIC_MODEL: z.string().trim().min(1).default('claude-haiku-5-5'),
  ASISTENTE_LIMITE_DIARIO: z.coerce.number().int().min(1).default(10),
  // HU-81 · Firma de la pasarela de pagos simulada. Cámbiala fuera de tu PC.
  PASARELA_SECRETO: z
    .string()
    .min(32, 'Debe tener al menos 32 caracteres')
    .default('pasarela-demo-mototrack-solo-para-desarrollo'),
});

export type Env = z.infer<typeof envSchema>;

/** Valida las variables de entorno. Si falta alguna, detiene el arranque y dice cuál. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const detalle = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Variables de entorno inválidas o faltantes:\n${detalle}\nRevisa backend/.env (copia backend/.env.example).`,
    );
  }
  return result.data;
}

export const env = parseEnv(process.env);
export const isProduction = env.NODE_ENV === 'production';
