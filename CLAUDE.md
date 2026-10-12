# CLAUDE.md · Reglas del proyecto MotoTrack

Instrucciones para Claude y para el equipo. Claude Code lee este archivo al empezar cada sesión.

## 0. Antes de empezar cualquier sesión

1. Leer **`Memoria.md`**: estado actual, sesión activa y decisiones recientes.
2. Leer **`PROGRESS.md`**: qué historias están hechas y cuál sigue.
3. Consultar **`contexto.md`** cuando haga falta la visión, el stack o la arquitectura.
4. Consultar **`docs/HISTORIAS.md`** para los criterios de aceptación de la historia que se va a trabajar.

**Al terminar la sesión:** actualizar `Memoria.md` (estado y bitácora) y marcar en `PROGRESS.md` lo que se terminó.

## 1. Cómo trabaja Claude en este proyecto

- **Responder siempre en español.** La usuaria no entiende inglés.
- **Pedir permiso antes de cualquier cosa que cueste dinero**: planes pagos, servicios en la nube, APIs de pago, WhatsApp, OTP, etc.
- **Preguntar antes de hacer algo fuera del plan acordado** en `PROGRESS.md` o en la sesión.
- **No hacer `commit` ni `push` sin que se pida.** El equipo revisa y sube cada rama.
- **Autor de los commits:** el integrante que lo pida (por ejemplo `JEsp04 <Jhojan.espinosaa@comunidad.iush.edu.co>`). **Sin** líneas `Co-Authored-By` ni `Claude-Session` en los mensajes.
- **No tocar cambios sin commit de otra persona.** Si hay archivos modificados que no son de la tarea, preguntar.
- **No reescribir historia ya subida** (`push --force`, `rebase` de ramas publicadas) sin aprobación explícita.
- **Explicar en lenguaje sencillo.** El equipo está aprendiendo Prisma y TypeScript. Cuando se pidan comandos, darlos completos y en orden, para Windows (PowerShell).
- **Mobile first:** toda pantalla se diseña primero para 390 px y luego para 1280 px.

## 2. Comandos

### Backend (`backend/`)

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias y genera el cliente de Prisma (`postinstall`) |
| `npm run dev` | API en `http://localhost:4000/api` con recarga automática |
| `npm test` | Pruebas con Vitest + Supertest. Crea y borra sola la base `TEST_DATABASE_URL` |
| `npm run lint` | ESLint |
| `npm run typecheck` | Revisa tipos sin compilar |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run build` | `prisma generate` + compila a `dist/` |
| `npm run db:migrate -- --name <nombre>` | Crea una migración nueva después de cambiar `schema.prisma` |
| `npm run db:deploy` | Aplica migraciones pendientes (sin crear nuevas) |
| `npm run seed` | Borra y recrea los datos de ejemplo (se niega en producción) |
| `npm run db:studio` | Abre Prisma Studio para ver la base |

### Frontend (`frontend/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | App en `http://localhost:5173` |
| `npm test` | Pruebas con Vitest + Testing Library |
| `npm run lint` | ESLint |
| `npm run typecheck` | Revisa tipos |
| `npm run build` | Revisa tipos + empaqueta en `dist/` |
| `npm run preview` | Sirve el build para verlo como en producción |

**Ruta solo de desarrollo:** `/dev/ui` (catálogo de componentes).

**Cuentas de prueba (después de `npm run seed`):** clave `MotoTrack2026` para `admin@mototrack.co`, `andres@mototrack.co`, `felipe@mototrack.co`, `laura@correo.co` y `juan@correo.co`.

## 3. Estilo de código

### General

- **TypeScript estricto** en backend y frontend. Prohibido `any`; si es inevitable, comentar por qué.
- **Prettier** decide el formato: comillas simples, punto y coma, coma final, 100 columnas, saltos de línea LF.
- **Nombres del dominio en español** (`tallerId`, `crearOrden`, `estadoNuevo`). Los términos técnicos pueden quedar en inglés (`handler`, `store`, `schema`).
- **Comentarios y mensajes al usuario en español.** Los mensajes de error deben decir qué pasó y qué hacer.
- **Dinero:** pesos enteros (`Int`), nunca decimales. Se muestra con `formatPesos` → «$ 85.000».
- **Fechas:** se guardan en UTC; se muestran en hora de Colombia con `formatFecha` y `formatFechaHora`.
- **Placas:** en mayúsculas y sin espacios en la base (`ABC12D`); se muestran con el componente `Plate`.

### Backend

- **Estructura por módulo:** `src/modules/<modulo>/` con `*.routes.ts`, `*.controller.ts`, `*.service.ts` y `*.schemas.ts`.
  - **Rutas:** solo conectan URL, middlewares y controlador.
  - **Controlador:** valida la entrada con Zod (`schema.parse(req.body)`) y responde.
  - **Servicio:** la lógica y Prisma. Nunca usa `req` ni `res`.
- **Imports con extensión `.js`** aunque el archivo sea `.ts`, porque el proyecto usa NodeNext: `import { env } from '../config/env.js'`.
- **Errores:** lanzar `HttpError` (`HttpError.notFound()`, `HttpError.conflict('…')`). El manejador central arma la respuesta. Express 5 captura los errores de funciones `async`; no hace falta `try/catch` para eso.
- **Multi-taller:** toda consulta de negocio filtra por `req.user.tallerId`. Un recurso de otro taller responde **404**, no 403.
- **Permisos:** `requireAuth` y luego `requireRole('admin', ...)`. La seguridad vive en el backend; el frontend solo esconde botones.
- **Nunca devolver `passwordHash`.** Usar `select` explícito en Prisma.
- **Prisma:** usar una sola instancia, `prisma` de `src/config/prisma.ts`.
- **Variables de entorno:** solo a través de `env` (`src/config/env.ts`, validado con Zod). Cada variable nueva va también en `.env.example`.

### Formato de la API

- Base `/api`; recursos en plural, en español y con guiones (`/ordenes`, `/detalles-servicio`).
- **Éxito:** `{ "data": ... }`. **Listas:** `{ "data": [...], "meta": { "page", "limit", "total" } }`.
- **Error:** `{ "message": "...", "errors": [{ "field": "placa", "message": "..." }] }`.
- **Códigos:**
  - 400: datos inválidos.
  - 401: sin sesión.
  - 403: sin permiso.
  - 404: no existe o es de otro taller.
  - 409: conflicto o transición de estado inválida.
  - 500: error inesperado.

### Frontend

- **Capas y dependencias.** ESLint impide romper esta regla:
  ```
  pages  →  features  →  components/ui, components/layout  →  lib, types
  ```
  `components`, `lib` y `types` no importan de `features`, `pages` ni `router`.
- **Alias `@/`** para todo lo que está en `src/` (`import { Button } from '@/components/ui'`).
- **Una funcionalidad = una carpeta en `features/<nombre>/`** con `api/`, `hooks/`, `components/`, `store/`, `schemas/` e `index.ts`. Lo que se usa afuera se exporta desde `index.ts`.
- **Formularios:** React Hook Form + `zodResolver` con esquemas en `features/<f>/schemas/`, con las mismas reglas del backend. Los errores de la API se ponen con `aplicarErroresDeCampo` (`@/lib/form-errors`).
- **Datos del servidor:** TanStack Query (`useQuery` y `useMutation`) sobre `http` de `@/lib/http`. **Zustand** solo para la sesión y el estado de interfaz.
- **Errores de la API:** `parseApiError(error)` → `{ message, fields }` para poner cada mensaje bajo su campo.
- **Tokens:** el token de acceso vive solo en memoria (Zustand). **Nunca** en `localStorage` ni `sessionStorage`.
- **Estilos:** clases de Tailwind con los tokens de `src/styles/index.css`. **Prohibido** escribir colores hexadecimales fuera de ese archivo.
  - Texto sobre `bg-primary` va en `text-brand-navy`.
  - Texto cian sobre blanco va en `text-primary-text`.
- **Componentes:** reutilizar `components/ui` (Button, Input, Select, Textarea, Card, Badge, StatusBadge, Plate, AppBar, BottomSheet, Tabs, EmptyState, Skeleton, Toaster). Un componente con lógica de negocio va en `features/<f>/components`, no en `ui`.
- **Accesibilidad:**
  - Zona de toque mínima de 48 px (`min-h-touch`).
  - Etiqueta en todo campo.
  - `aria-invalid` cuando hay error.
  - Foco visible.
- **Páginas:** se cargan con `lazy` desde `src/router/index.tsx`. El menú de cada rol está en `src/router/nav.ts`.

### Pruebas

- Cada historia lleva al menos una prueba que cubra sus criterios de aceptación principales.
- **Backend:** Supertest contra la app y base MySQL real de pruebas (`tests/helpers/db.ts` para limpiar y crear datos).
- **Frontend:** Testing Library; buscar por rol y texto visible (`getByRole('button', { name: 'Guardar' })`), no por clases.

## 4. Base de datos con Prisma

1. **El esquema manda:** cualquier cambio de tablas se hace en `backend/prisma/schema.prisma`.
2. Luego `npm run db:migrate -- --name descripcion_corta`. Esto crea una carpeta nueva en `prisma/migrations/`.
3. **Nunca editar una migración ya subida a `develop`.** Para corregir, se crea otra migración.
4. `src/generated/` lo crea `prisma generate` y **no va a git**.
5. Si Prisma dice *drift detected* en una base local sin datos importantes: `npx prisma migrate reset`.

## 5. Git

- **Ramas:**
  - `main`: entregas.
  - `develop`: integración.
  - `feature/…`, `fix/…`, `chore/…`, `docs/…`: trabajo, siempre desde `develop` actualizado.
- **PR siempre hacia `develop`** (¡no hacia `main!`), con 1 revisión y la revisión automática de GitHub en verde.
- **Commits en español con prefijo:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Al final, las historias que cubre (`HU-19, HU-20`).
- **Antes de cambiar de rama:** `git status`. Un `package-lock.json` modificado sin razón se descarta con `git checkout -- <ruta>`.
- **Nunca subir** `.env`, `node_modules`, `dist` ni `src/generated`.

## 6. Definición de terminado

Una historia está terminada cuando:

1. Cumple **todos** sus criterios de aceptación (`docs/HISTORIAS.md`).
2. Se ve y funciona en **390 px y 1280 px**, sin desplazamiento horizontal.
3. Usa los tokens del sistema de diseño y los componentes `ui`.
4. Valida datos en frontend **y** backend; los permisos se revisan en el backend.
5. Tiene al menos una prueba, y `lint`, `typecheck`, `test` y `build` pasan.
6. Está en un PR hacia `develop`, revisado por otra persona.
7. Quedó marcada en `PROGRESS.md`.
