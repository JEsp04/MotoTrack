# MotoTrack

Aplicación web *mobile first* para talleres de motos en Medellín: órdenes de servicio, diagnósticos y seguimiento para el cliente.

- Contexto, stack y convenciones: [`docs/CONTEXTO.md`](docs/CONTEXTO.md)
- Lista de tareas (historias de usuario): [`docs/HISTORIAS.md`](docs/HISTORIAS.md)

## Requisitos

- Node.js 22 o superior
- MySQL 8 en tu equipo (o la base de Aiven del equipo)

## Arrancar en tu equipo

```bash
# 1. Backend
cd backend
cp .env.example .env      # en Windows: copy .env.example .env  (y cambia los valores)
npm install               # también genera el cliente de Prisma
npm run db:deploy         # crea las tablas en tu MySQL (la base debe existir: CREATE DATABASE mototrack;)
npm run seed              # datos de ejemplo
npm run dev               # API en http://localhost:4000/api

# 2. Frontend (en otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # App en http://localhost:5173
```

## Cuentas de prueba (después de `npm run seed`)

Clave para todas: `MotoTrack2026`

| Rol | Correo |
|---|---|
| Admin | admin@mototrack.co |
| Mecánico | andres@mototrack.co, felipe@mototrack.co |
| Cliente | laura@correo.co, juan@correo.co |

## Base de datos (Prisma)

| Comando (en `backend/`) | Qué hace |
|---|---|
| `npm run db:migrate -- --name <nombre>` | Crea una migración nueva después de cambiar `prisma/schema.prisma` |
| `npm run db:deploy` | Aplica las migraciones pendientes (sin crear nuevas) |
| `npm run seed` | Borra y vuelve a crear los datos de ejemplo (nunca en producción) |
| `npm run db:studio` | Abre Prisma Studio para ver los datos |

## Pruebas del backend

Las pruebas usan una base MySQL aparte que se borra y se crea sola en cada corrida. Pon en `backend/.env`:

```
TEST_DATABASE_URL=mysql://root:TU_CLAVE@localhost:3306/mototrack_test
```

El nombre debe terminar en `_test`; si no, las pruebas se niegan a correr.

## Comandos útiles (en `backend/` o `frontend/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca en modo desarrollo |
| `npm test` | Corre las pruebas |
| `npm run lint` | Revisa el código con ESLint |
| `npm run format` | Da formato con Prettier |
| `npm run build` | Compila para producción |

## Forma de trabajo

Ramas `feature/…`, `fix/…` o `chore/…` desde `develop`, PR hacia `develop` con 1 revisión y la revisión automática en verde. Detalle en `docs/CONTEXTO.md`, sección 11.
