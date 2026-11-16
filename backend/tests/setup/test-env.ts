import 'dotenv/config';

/** Base exclusiva para pruebas: se borra y se vuelve a crear en cada corrida. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://root:root@localhost:3306/mototrack_test';
