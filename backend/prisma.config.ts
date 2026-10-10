import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Sin DATABASE_URL (por ejemplo en la revisión automática) igual se puede ejecutar prisma generate
    url: process.env.DATABASE_URL ?? 'mysql://sin-configurar@localhost:3306/mototrack',
  },
});
