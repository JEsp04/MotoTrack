import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import { env, isProduction } from './env.js';

/**
 * Convierte DATABASE_URL (mysql://usuario:clave@host:puerto/base?ssl-mode=REQUIRED)
 * en la configuración del adaptador de MySQL/MariaDB que usa Prisma 7.
 */
export function adapterFromUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const sslMode = (
    url.searchParams.get('ssl-mode') ??
    url.searchParams.get('sslmode') ??
    ''
  ).toUpperCase();
  const usarSsl = sslMode !== '' && sslMode !== 'DISABLED';

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    // En Vercel cada función abre sus propias conexiones: pocas por instancia
    connectionLimit: isProduction ? 2 : 5,
    // Aiven exige SSL (?ssl-mode=REQUIRED). Su certificado lo firma la CA de Aiven.
    ssl: usarSsl ? { rejectUnauthorized: false } : undefined,
    // Necesario con MySQL 8 sin SSL en local (autenticación caching_sha2_password)
    allowPublicKeyRetrieval: !usarSsl,
  });
}

/** Una sola instancia del cliente para toda la aplicación. */
export const prisma = new PrismaClient({ adapter: adapterFromUrl(env.DATABASE_URL) });
