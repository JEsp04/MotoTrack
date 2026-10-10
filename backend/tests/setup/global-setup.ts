/**
 * Prepara la base de pruebas una vez antes de todas las pruebas:
 * la borra, la vuelve a crear y aplica las migraciones de prisma/migrations en orden.
 *
 * Por seguridad solo trabaja con bases cuyo nombre termina en "_test".
 * Configúrala con TEST_DATABASE_URL (por defecto mysql://root:root@localhost:3306/mototrack_test).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mariadb from 'mariadb';
import { TEST_DATABASE_URL } from './test-env.js';

export default async function globalSetup() {
  const url = new URL(TEST_DATABASE_URL);
  const base = url.pathname.replace(/^\//, '');
  if (!base.endsWith('_test')) {
    throw new Error(`La base de pruebas debe terminar en _test (recibí "${base}")`);
  }

  let conn;
  try {
    conn = await mariadb.createConnection({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      multipleStatements: true,
      allowPublicKeyRetrieval: true,
    });
  } catch (error) {
    throw new Error(
      `No pude conectar a MySQL para las pruebas (${url.hostname}:${url.port || 3306}). ` +
        'Revisa que MySQL esté encendido y TEST_DATABASE_URL en backend/.env.\n' +
        String(error),
      { cause: error },
    );
  }

  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${base}\``);
    await conn.query(
      `CREATE DATABASE \`${base}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.query(`USE \`${base}\``);

    const dir = join(import.meta.dirname, '../../prisma/migrations');
    const migraciones = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const nombre of migraciones) {
      await conn.query(readFileSync(join(dir, nombre, 'migration.sql'), 'utf8'));
    }
  } finally {
    await conn.end();
  }
}
