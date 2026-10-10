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
npm install
npm run dev               # API en http://localhost:4000/api

# 2. Frontend (en otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # App en http://localhost:5173
```

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
