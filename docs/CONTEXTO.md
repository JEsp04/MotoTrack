# MotoTrack — Contexto del proyecto

Documento base para los 3 integrantes del equipo y para cualquier asistente de IA que trabaje en el código. Si una decisión cambia, se actualiza aquí en el mismo Pull Request.

Última actualización: 9 de octubre de 2026 (21:10).

---

## 1. Qué estamos construyendo

MotoTrack es una aplicación web para **talleres de motos en Medellín**. Centraliza órdenes de servicio, clientes, motos, inventario, citas e historial de mantenimiento, y usa IA para sugerir mantenimientos preventivos.

- **Modelo de negocio:** SaaS por suscripción mensual por taller (Básico $80.000 · Inteligente $130.000). Para el cliente final es gratis.
- **Referencia visual y funcional:** el prototipo navegable y el sistema de diseño hechos con Claude. Mandan sobre colores, tipografía, pantallas y flujos.
  - Prototipo: https://claude.ai/artifact/2BVQyEDGXhNiZg4QE7xyRh
  - Sistema de diseño: https://claude.ai/artifact/7varWM3SpNNuTbUuC5cnqn
- **Principio de diseño:** *mobile first*. Toda pantalla se diseña primero a 360–430 px y luego se adapta a tablet (≥ 768 px) y escritorio (≥ 1024 px).

## 2. Roles

| Rol | Cómo entra | Qué puede hacer |
|---|---|---|
| `admin` | Registra el taller | Todo el taller: órdenes, clientes, motos, inventario, citas, usuarios, reportes, suscripción |
| `mecanico` | Por invitación del admin | Sus órdenes asignadas, diagnóstico, cambios de estado, alertas IA, consulta de inventario |
| `cliente` | Se registra solo (correo y contraseña en el MVP) | Sus motos, seguimiento de órdenes, aprobar o rechazar cotizaciones, citas |

El rol `recepcionista` **se elimina** del modelo de datos.

## 3. Alcance del MVP (primera entrega)

**Incluye**
1. Base del proyecto: estructura, configuración, sistema de diseño en Tailwind, router, calidad (lint, formato, pruebas).
2. Autenticación: registro, inicio y cierre de sesión, renovación de sesión, protección de rutas por rol.
3. Clientes y motos (con placa).
4. Órdenes de servicio con su máquina de estados (sección 7), diagnóstico, detalle de servicios y repuestos, e historial de cambios.

**Queda fuera o simulado en el MVP:** IA (predicciones y asistente), pagos, WhatsApp, SMS y verificación por código (OTP), inventario completo, citas, reportes.

## 4. Stack

Las versiones exactas quedan fijadas en cada `package.json` al instalar. Node **22 LTS** y npm 10.

### Frontend (`frontend/`)
| Necesidad | Herramienta |
|---|---|
| Base | React 19 + Vite, SPA |
| Lenguaje | **TypeScript** en modo estricto (se migra la plantilla actual de JSX a TSX) |
| Rutas | React Router (rutas anidadas, guardas por rol, carga diferida por página) |
| Datos del servidor | **TanStack Query** (caché, carga, errores, reintentos) sobre **Axios** |
| Estado de la app | **Zustand** solo para sesión (usuario, rol, token en memoria) y estado de interfaz. Los datos de la API no se guardan en Zustand. |
| Estilos | **Tailwind CSS** con los tokens de MotoTrack (sección 9) |
| Formularios | Propuesto: React Hook Form + Zod (validación compartible con el backend) |
| Calidad | ESLint + Prettier + Vitest + Testing Library |

### Backend (`backend/`)
| Necesidad | Herramienta |
|---|---|
| Servidor | Node 22 + Express 5 en **TypeScript** estricto (ES Modules; `tsx` para desarrollo, `tsc` para compilar) |
| Base de datos | MySQL 8 |
| Acceso a datos | **Prisma**: reemplaza a Sequelize, con esquema, migraciones y cliente tipado |
| Contraseñas | bcryptjs (costo 12) |
| Sesión | jsonwebtoken (token de acceso + token de renovación) |
| Configuración | dotenv |
| Seguridad | cors (solo el origen del frontend, con credenciales), cookie-parser |
| Validación | Zod (los esquemas se pueden compartir con el frontend) |
| Calidad | ESLint + Prettier + Vitest + Supertest |

## 5. Estructura del repositorio

Un solo repositorio: `github.com/JEsp04/MotoTrack`.

```
MotoTrack/
├── docs/                 # este documento y decisiones
├── frontend/             # React + Vite + TS
└── backend/              # Express + Prisma
```

### Frontend: `frontend/src/`
```
src/
├── main.tsx              # punto de entrada
├── app/                  # App.tsx, providers (QueryClient, Router), estilos globales
├── router/               # definición de rutas, guardas (RequireAuth, RequireRole), layouts por rol
├── pages/                # una carpeta por pantalla; solo compone features y componentes
│   ├── auth/             # LoginPage, RegisterPage
│   ├── admin/            # DashboardPage, OrdersPage, OrderDetailPage, ClientsPage...
│   ├── mecanico/
│   └── cliente/
├── features/             # lógica encapsulada por funcionalidad
│   ├── auth/
│   │   ├── api/          # llamadas Axios (authApi.ts)
│   │   ├── hooks/        # useLogin, useLogout, useSession (TanStack Query)
│   │   ├── store/        # authStore.ts (Zustand)
│   │   ├── components/   # LoginForm, RegisterForm
│   │   ├── schemas/      # validaciones Zod
│   │   └── index.ts      # lo único que se importa desde fuera de la feature
│   ├── clientes/
│   ├── motos/
│   └── ordenes/          # incluye la máquina de estados y el historial
├── components/
│   ├── ui/               # Button, Input, StatusChip, Plate, Card, BottomSheet... sin lógica de negocio
│   └── layout/           # AppBar, BottomNav, SideNav, AppShell
├── lib/                  # axios.ts (instancia + interceptores), queryClient.ts, formatters (COP, km, fechas)
├── types/                # tipos compartidos: Usuario, Rol, Orden, EstadoOrden, respuestas de la API
└── assets/
```

**Reglas de dependencia**
- `pages` → `features` → `components/ui` → `lib` y `types`. Nunca al revés.
- Una feature no importa archivos internos de otra; solo su `index.ts`.
- `components/ui` no conoce la API ni Zustand: recibe todo por props.

### Backend: `backend/src/`
```
src/
├── app.ts                # express, cors, json, cookies, rutas, manejador de errores
├── config/               # env.ts (valida variables con Zod), prisma.ts
├── modules/              # una carpeta por recurso
│   ├── auth/             # auth.routes.ts, auth.controller.ts, auth.service.ts, auth.schemas.ts
│   ├── talleres/
│   ├── usuarios/
│   ├── clientes/
│   ├── motos/
│   └── ordenes/
├── middlewares/          # requireAuth, requireRole, validate, errorHandler
├── types/                # tipos propios (Request con usuario, etc.)
└── utils/
prisma/
├── schema.prisma
├── migrations/
└── seed.ts               # datos de ejemplo del prototipo (Taller Central, OT-1045...)
server.ts                 # arranque local (app.listen)
api/index.ts              # entrada para Vercel (exporta la app)
```

## 6. Autenticación y sesión

- **Token de acceso:** JWT de 15 minutos con `{ usuarioId, rol, tallerId }`. El frontend lo guarda **solo en memoria** (Zustand) y lo envía en `Authorization: Bearer`.
- **Token de renovación:** JWT de 7 días en una **cookie `httpOnly`, `Secure`, `SameSite=Strict`** con ruta `/api/auth`. Se guarda su hash en la base de datos para poder revocarlo, y se rota en cada uso.
- **Endpoints:**

| Método y ruta | Uso |
|---|---|
| `POST /api/auth/register` | Registro de cliente |
| `POST /api/auth/register-taller` | Crea el taller y su administrador |
| `POST /api/auth/login` | Inicio de sesión |
| `POST /api/auth/refresh` | Renovar la sesión con la cookie |
| `POST /api/auth/logout` | Cerrar sesión: borra la cookie y revoca el token |
| `GET /api/auth/me` | Perfil del usuario |

- **Al recargar la página**, el frontend llama a `/refresh` para recuperar la sesión. Si Axios recibe un 401, intenta un `/refresh` (una sola vez) y repite la petición.
- **Varios talleres:** toda consulta del backend filtra por el `tallerId` del token. Un taller nunca ve datos de otro.
- La invitación de mecánicos y la recuperación de contraseña siguen los flujos del prototipo, pero entran después del MVP.

## 7. Máquina de estados de la orden

Valores del enum en base de datos y en `types/` (en `snake_case`):

| Estado | Acciones disponibles | Pasa a |
|---|---|---|
| `registrada` | Registrar diagnóstico | `diagnosticada` |
| `diagnosticada` | Enviar cotización | `esperando_aprobacion` |
| `esperando_aprobacion` | Cliente aprueba · Cliente rechaza (motivo obligatorio) | `aprobada` · `cancelada` |
| `aprobada` | Iniciar reparación | `en_reparacion` |
| `en_reparacion` | Terminar · Falta repuesto | `lista_entrega` · `pendiente_repuesto` |
| `pendiente_repuesto` | Repuesto recibido | `en_reparacion` |
| `lista_entrega` | Entregar moto | `entregada` |
| `entregada` | Cerrar orden | `cerrada` |
| `cerrada`, `cancelada` | Solo lectura | — |

**Reglas**
- **Una sola fuente de verdad:** el mapa de transiciones vive en el backend (`modules/ordenes/estados.ts`), y el frontend refleja el mismo mapa en `features/ordenes/estados.ts`.
- El backend rechaza con **409** cualquier transición que no esté en la tabla.
- Cada cambio crea un registro en `historial_orden` con estado anterior, estado nuevo, usuario, fecha y observación.
- Solo una orden `entregada` puede cerrarse.
- **Nueva tabla:** `historial_orden`.
- **Cambio en tabla existente:** el enum de `ordenes_servicio.estado` pasa de 6 a 10 valores.

## 8. Convenciones de la API

- Base `/api`, recursos en plural y en español con guiones: `/api/ordenes-servicio`, `/api/motocicletas`.
- **Respuesta correcta:** `{ "data": ... }`. Las listas son paginadas, con `?page=1&limit=20`, y llevan además `{ "meta": { page, limit, total } }`.
- **Error:** `{ "message": "texto para el usuario", "errors": [{ "field", "message" }] }`.
- **Códigos:** 400 validación · 401 sin sesión · 403 sin permiso · 404 no existe · 409 conflicto (duplicado o transición inválida) · 500 error interno.
- Fechas en ISO 8601 (UTC) en la API; el frontend las muestra en hora de Colombia.
- Dinero en pesos enteros (sin decimales) en la API; el frontend lo formatea como `$ 132.000`.

## 9. Sistema de diseño en Tailwind

Los tokens del sistema de diseño se declaran como variables CSS con `@theme` (Tailwind v4), con tema claro y oscuro.

| Token | Claro | Uso |
|---|---|---|
| `brand-navy` | `#0B1F33` | Navegación, texto principal |
| `brand-cyan` / `primary` | `#00B8D9` | Acción principal (texto encima en navy, nunca blanco) |
| `primary-text` | `#007A91` | Enlaces y texto cian sobre blanco |
| `brand-orange` / `accent` | `#FF7A00` | Atención (máximo un elemento por pantalla) |
| `accent-text` | `#B24F00` | Texto naranja sobre blanco |
| `brand-green` / `success` | `#1E9E67` | Hecho / confirmación |
| `success-text` | `#13744A` | Texto verde |
| `danger` | `#C0362F` | Errores, cancelar |
| `bg` / `surface` / `surface-sunken` | `#F4F6F8` / `#FFFFFF` / `#F4F6F8` | Fondos |
| `ink` / `ink-muted` | `#0B1F33` / `#5A6B7D` | Texto |
| `border` / `border-strong` | `#DDE3E9` / `#748391` | Bordes (el fuerte en campos) |
| `plate` | `#F7C600` | Solo el componente Placa |

- **Tipografía:** Montserrat 600 y 700 para títulos y cifras; Inter 400, 600 y 700 para la interfaz. Base de 16 px, que es el mínimo en campos para que iOS no haga zoom.
- **Espaciado y forma:** espaciado 4/8/12/16/24/32 px; radios de 8 (botones y campos), 12 (tarjetas), 20 (hojas) y píldora; altura mínima táctil de 48 px.
- **Navegación:** inferior en móvil y lateral de 240 px desde 1024 px.
- **Componentes base a construir primero** en `components/ui`: Button, IconButton, Input/TextField, Select, Checkbox, StatusChip, Plate, Card, BottomSheet, Snackbar, EmptyState, Tabs, FilterChips.

## 10. Variables de entorno

Nunca se suben a GitHub; cada carpeta tiene un `.env.example` con todas las claves vacías.

**backend/.env**
```
PORT=4000
NODE_ENV=development
DATABASE_URL="mysql://usuario:clave@localhost:3306/mototrack"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000/api
```

## 11. Forma de trabajo en Git

- **Ramas:**
  - `main` es lo entregado y estable.
  - `develop` es la integración.
  - Cada tarea va en su propia rama desde `develop`: `feature/<tema>`, `fix/<tema>`, `chore/<tema>`.
- **Unir cambios:**
  - Pull Request hacia `develop`, con **revisión de al menos 1 compañero** y lint y pruebas en verde.
  - De `develop` a `main` solo en entregas, con un PR propio.
- **Commits** en español con prefijo: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Ejemplo: `feat(ordenes): cambiar estado con historial`.
- **Nunca se suben:** `node_modules/`, `.env`, `dist/`, `coverage/`.
- **Antes de abrir un PR:** `npm run lint`, `npm run test` y `npm run build` sin errores.

## 12. Definición de "terminado"

Una tarea está terminada cuando:
1. Funciona en celular (390 px) y en escritorio (1280 px).
2. Respeta los tokens y componentes del sistema de diseño.
3. Valida datos en frontend y backend, y muestra errores entendibles.
4. Respeta los permisos por rol en el backend, no solo ocultando botones.
5. Tiene al menos una prueba de la lógica principal.
6. Pasó revisión en un PR hacia `develop`.

## 13. Arreglos inmediatos detectados en el repositorio (9-oct-2026)

1. **Dependencias en el repositorio:** `backend/node_modules` está subido a GitHub (3.773 archivos). Hay que sacarlo con `git rm -r --cached backend/node_modules` y agregar un `.gitignore` en la raíz.
2. **Scripts rotos:** `npm run dev` y `npm start` del backend apuntan a `index.js`, pero el archivo es `server.js`.
3. **CORS:** `cors()` está abierto a cualquier origen; hay que limitarlo a `CORS_ORIGIN` con credenciales.
4. **Backend a TypeScript + Prisma:** se pasa el código de JavaScript a TypeScript y se pasan los 13 modelos de Sequelize a `schema.prisma`. Cambios en el modelo:
   - quitar el rol `recepcionista`;
   - pasar el enum de la orden a los 10 estados;
   - agregar `historial_orden` y la tabla de tokens de renovación.
5. **Sesión:** cambiar de un solo token de 8 h a acceso + renovación (sección 6).
6. **Frontend:** migrar la plantilla de JSX a TypeScript y crear la estructura de `src/`.

## 14. Orden de trabajo y calendario

**Primera entrega: viernes 17 de octubre de 2026.**

| Fechas | Etapa | Contenido | Ramas sugeridas |
|---|---|---|---|
| 10 oct | 0 | Arreglos inmediatos, TypeScript en back y front, calidad, `.env.example` | `chore/limpieza-repo`, `chore/typescript` |
| 11–12 oct | 1 | Prisma: esquema, migración inicial, datos de ejemplo | `feature/prisma` |
| 11–13 oct | 2 | Base del frontend: Tailwind con tokens, router, layouts, componentes ui | `feature/frontend-base` |
| 12–13 oct | 2 | Auth en backend (acceso + renovación) | `feature/auth-sesion` |
| 14 oct | 3 | Auth en frontend: login, registro, guardas por rol | `feature/auth-frontend` |
| 14–15 oct | 4 | Clientes y motos (API + pantallas) | `feature/clientes-motos` |
| 15–16 oct | 5 | Órdenes, estados e historial (API + pantallas) | `feature/ordenes` |
| 16 oct | — | Despliegue, pruebas de punta a punta y unión `develop → main` | `release/v0.1` |

Las filas que se cruzan en fechas van en paralelo entre integrantes.

> **Riesgo de plazo.** Migrar a TypeScript y a Prisma consume los primeros días. Si el 14 de octubre auth no está lista, la orden se entrega solo con creación, lista y cambio de estado (sin diagnóstico ni detalle de servicios), y lo demás pasa a la segunda entrega.

**Propuesta de reparto** (pendiente de confirmar por el equipo):
- **Integrante A (backend):** etapas 0 y 1 del backend, auth en backend y API de órdenes.
- **Integrante B (frontend base):** etapa 0 del frontend, sistema de diseño, componentes ui, layouts y pantallas de órdenes.
- **Integrante C (integración):** auth en frontend, clientes y motos (API + pantallas), y el despliegue.

## 15. Despliegue (aprobado el 9-oct-2026)

| Pieza | Dónde | Costo |
|---|---|---|
| Frontend (Vite) | Vercel, plan Hobby | Gratis |
| API (Express) | **El mismo proyecto de Vercel**, como función en `/api` | Gratis |
| MySQL | Aiven for MySQL, plan gratuito (1 GB, 76 conexiones) | Gratis, sin tarjeta |

**Por qué así**
- **Las cookies funcionan sin trucos:** frontend y API quedan en el mismo dominio, así que la cookie de renovación (`SameSite=Strict`) funciona sin CORS entre dominios. Con dominios distintos, Safari y otros navegadores pueden bloquearla.
- **Costo cero** para la entrega académica.

**Cuidados**
- **Vercel Hobby es solo para uso no comercial.** Cuando se cobre a talleres hay que pasar a Pro (USD 20 por integrante al mes).
- **Aiven puede apagar la base gratuita si no tiene actividad.** Se vuelve a encender desde su panel; hay que revisarla antes de cada presentación.
- **Prisma en funciones:** usar una sola instancia del cliente por función y pocas conexiones.

**Alternativa de pago**
- Railway con servidor Express tradicional y MySQL en el mismo lugar: USD 5 al mes y pide tarjeta incluso para la prueba. Más simple de operar, pero **solo con aprobación** antes de contratar.

## 16. Preguntas abiertas

- ¿Quién lleva cada etapa? (sección 14, propuesta pendiente)

La lista de tareas está en [`HISTORIAS.md`](./HISTORIAS.md).
