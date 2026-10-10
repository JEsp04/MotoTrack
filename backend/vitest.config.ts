import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // Valores solo para pruebas: no se conectan a nada real
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://test:test@localhost:3306/mototrack_test',
      JWT_ACCESS_SECRET: 'secreto-de-acceso-solo-para-pruebas-0123456789',
      JWT_REFRESH_SECRET: 'secreto-de-renovacion-solo-para-pruebas-0123456789',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
