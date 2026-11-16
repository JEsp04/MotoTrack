import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/setup/test-env.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
    // Las pruebas comparten una base: se corren de a un archivo
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'secreto-de-acceso-solo-para-pruebas-0123456789',
      JWT_REFRESH_SECRET: 'secreto-de-renovacion-solo-para-pruebas-0123456789',
      JWT_ACCESS_EXPIRES: '15m',
      JWT_REFRESH_EXPIRES: '7d',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
