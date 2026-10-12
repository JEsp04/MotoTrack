# contexto.md · Visión general y stack técnico de MotoTrack

Qué es el producto, cómo está construido y por qué. Cambia poco; si una decisión de arquitectura cambia, se actualiza aquí en el mismo PR.

- Reglas de código y comandos: `CLAUDE.md`
- Estado actual y sesión activa: `Memoria.md`
- Tareas y calendario: `PROGRESS.md`
- Historias de usuario con criterios de aceptación: `docs/HISTORIAS.md`

Última actualización: 12 de octubre de 2026.

---

## 1. Qué es MotoTrack

Aplicación web para **talleres de motos en Medellín**. Centraliza órdenes de servicio, clientes, motos, diagnósticos e historial de mantenimiento. Más adelante sumará citas, inventario y recomendaciones de mantenimiento con IA.

- **Modelo de negocio:** SaaS por suscripción mensual por taller (Básico $ 80.000 · Inteligente $ 130.000). Para el cliente final es gratis.
- **Principio de diseño:** *mobile first*. Cada pantalla se diseña primero a 390 px y luego se adapta a escritorio (≥ 1024 px).
- **Referencia visual y funcional:** el prototipo y el sistema de diseño mandan sobre colores, tipografía, pantallas y flujos.
  - Prototipo navegable: https://claude.ai/artifact/2BVQyEDGXhNiZg4QE7xyRh
  - Sistema de diseño: https://claude.ai/artifact/7varWM3SpNNuTbUuC5cnqn
- **Equipo:** 3 integrantes, repositorio `github.com/JEsp04/MotoTrack`.
- **Primera entrega:** viernes 17 de octubre de 2026.

## 2. Roles

| Rol | Cómo entra | Qué puede hacer |
|---|---|---|
| `admin` | Registra el taller | Todo el taller: órdenes, clientes, motos, equipo |
| `mecanico` | El admin le crea la cuenta | Sus órdenes asignadas: diagnóstico y avance de la reparación. **No ve clientes.** |
| `cliente` | Se registra solo con correo y contraseña | Sus motos, el seguimiento de sus órdenes, aprobar o rechazar diagnósticos |

El rol `recepcionista` se eliminó.

## 3. Alcance

**Primera entrega (MVP):**
1. Base del proyecto: TypeScript, calidad, sistema de diseño, router.
2. Autenticación por roles con sesión segura.
3. Clientes, motos y cuentas de mecánico.
4. Órdenes de servicio con 10 estados, diagnóstico, servicios con costo e historial.
5. Despliegue en Vercel + Aiven.

**Segunda entrega o después:**
- Citas e inventario de repuestos.
- Alertas e IA de mantenimiento.
- Pagos y membresías.
- OTP por WhatsApp o correo (registro, invitaciones, recuperar contraseña).
- Notificaciones, reportes y landing comercial.

Varias de estas cuestan dinero y se consultan antes de contratar.

## 4. Stack

Node **22** y npm 10. Las versiones exactas están en cada `package.json`.

### Frontend (`frontend/`)

| Necesidad | Herramienta |
|---|---|
| Base | React 19 + Vite 8, SPA |
| Lenguaje | TypeScript 6, modo estricto, alias `@/` → `src/` |
| Rutas | React Router 7 (rutas anidadas, guardas por rol, páginas con `lazy`) |
| Datos del servidor | TanStack Query 5 sobre Axios (`src/lib/http.ts`) |
| Estado de la app | Zustand 5, solo sesión e interfaz |
| Estilos | Tailwind CSS 4 con tokens en `@theme` (`src/styles/index.css`) |
| Fuentes | Montserrat e Inter locales con `@fontsource` (sin Google Fonts) |
| Formularios | React Hook Form + Zod 4 (`@hookform/resolvers`) |
| Calidad | ESLint 10, Prettier, Vitest 5, Testing Library |

### Backend (`backend/`)

| Necesidad | Herramienta |
|---|---|
| Servidor | Express 5 en TypeScript estricto (ESM, NodeNext; `tsx` en desarrollo, `tsc` para compilar) |
| Base de datos | MySQL 8 (local en cada PC; en la nube: Aiven) |
| Acceso a datos | Prisma 7 con el adaptador `@prisma/adapter-mariadb` (compatible con MySQL) |
| Validación | Zod 4 |
| Contraseñas | bcryptjs, costo 12 |
| Sesión | jsonwebtoken (acceso) + token opaco de renovación en cookie |
| Seguridad | cors (solo `CORS_ORIGIN`, con credenciales), cookie-parser |
| Configuración | dotenv + validación de variables con Zod (`src/config/env.ts`) |
| Calidad | ESLint, Prettier, Vitest 5 + Supertest (pruebas con MySQL real) |

### Revisión automática

GitHub Actions (`.github/workflows/ci.yml`) corre en cada PR y en cada push a `develop` y `main`: formato, lint, tipos, pruebas y build de backend y frontend. Para las pruebas del backend levanta su propio MySQL.

## 5. Arquitectura

```
MotoTrack/
├── CLAUDE.md · contexto.md · Memoria.md · PROGRESS.md
├── docs/HISTORIAS.md                  # 40 historias con criterios de aceptación
├── .github/workflows/ci.yml
├── backend/
│   ├── server.ts                      # arranque local (app.listen)
│   ├── prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma              # modelo de datos (fuente de verdad)
│   │   ├── migrations/                # 20261010150000_inicial
│   │   └── seed.ts                    # datos de ejemplo
│   ├── src/
│   │   ├── app.ts                     # express, cors, json, cookies, rutas, errores
│   │   ├── routes.ts                  # monta /health, /auth, /talleres, /usuarios, /clientes, /motos
│   │   ├── config/                    # env.ts, prisma.ts
│   │   ├── middlewares/               # auth.ts (requireAuth, requireRole), error-handler.ts
│   │   ├── modules/
│   │   │   ├── auth/                  # routes, controller, service, schemas, tokens
│   │   │   ├── talleres/              # GET /talleres/publicos
│   │   │   ├── usuarios/              # equipo del taller (HU-23)
│   │   │   ├── clientes/              # HU-24, HU-25
│   │   │   └── motos/                 # HU-26, HU-27
│   │   ├── utils/                     # http-error, schemas (validaciones compartidas), prisma-errors
│   │   ├── types/express.d.ts         # req.user (UsuarioAutenticado)
│   │   └── generated/                 # cliente de Prisma (no va a git)
│   └── tests/                         # setup (crea la base _test), helpers, *.test.ts
└── frontend/
    └── src/
        ├── main.tsx · app/App.tsx     # QueryClientProvider + RouterProvider + Toaster
        ├── router/                    # index.tsx (rutas lazy), guards.tsx, nav.ts, RoleLayout.tsx
        ├── pages/                     # auth/ (login y registro), admin/, mecanico/, cliente/, dev/, 404, error
        ├── features/auth/             # api, hooks, schemas, formularios, sesión (Zustand + session-bootstrap)
        ├── features/equipo/           # mecánicos del taller
        ├── features/clientes/         # buscador, formulario y detalle
        ├── features/motos/            # formulario de moto y tarjeta con su orden abierta
        ├── components/ui/             # 16 componentes base
        ├── components/layout/         # AppLayout, AuthLayout, Logo
        ├── lib/                       # http, api-error, query-client, toast, format, estados-orden, cn, validaciones, use-debounce
        ├── types/                     # Rol, EstadoOrden, Usuario, Integrante, Moto, Cliente..., formato de la API
        └── styles/index.css           # tokens de Tailwind
```

**Reglas de dependencia del frontend:** `pages → features → components → lib/types`. ESLint impide importar en sentido contrario.

## 6. Modelo de datos (Prisma)

| Tabla | Para qué |
|---|---|
| `talleres` | Cada taller (multi-taller) |
| `usuarios` | admin, mecanico y cliente; correo único; `estado` activo o inactivo |
| `refresh_tokens` | Sesiones abiertas; solo se guarda el HMAC del token |
| `clientes` | Clientes del taller, con o sin cuenta (`usuarioId` opcional); documento único por taller |
| `motocicletas` | Placa única por taller, marca, referencia, modelo (año), cilindraje, kilometraje |
| `ordenes_servicio` | Número consecutivo por taller, moto, mecánico, estado (10), costo total en pesos |
| `historial_orden` | Cada cambio de estado: anterior, nuevo, usuario, fecha, observación |
| `diagnosticos` | Uno por orden: hallazgos, trabajo recomendado, prioridad |
| `servicios` | Catálogo de servicios y precios del taller |
| `detalle_servicios` | Servicios cobrados en cada orden |

**Reglas:**
- Toda tabla de negocio tiene `tallerId`.
- Las llaves son `Int` autoincrementales. `talleres`, `usuarios`, `clientes`, `motocicletas` y `ordenes_servicio` tienen además `publicId` (UUIDv7, `CHAR(36)`, único), que es lo único que sale en URLs y respuestas.
- Los textos tienen largo máximo en la base, y el mismo límite se valida con Zod en el backend y en el frontend.
- El dinero se guarda en pesos enteros.
- Las fechas van en UTC.

## 7. Autenticación y sesión

- **Token de acceso:** JWT HS256 de 15 minutos con `{ usuarioId, rol, tallerId }` (los `Int` internos; el token está firmado y el frontend no los usa). Las respuestas devuelven el usuario con `publicId` y `taller: { publicId, nombre }`. El frontend lo guarda **solo en memoria** y lo envía como `Authorization: Bearer`.
- **Token de renovación:** valor aleatorio de 7 días en una cookie `httpOnly`, `SameSite=Strict`, con ruta `/api/auth` y `Secure` en producción.
  - En la base se guarda su HMAC-SHA256 con `JWT_REFRESH_SECRET`.
  - Se **rota** en cada uso. Si alguien reutiliza uno ya usado, se cierran todas las sesiones del usuario.
- **Al abrir o recargar la página**, el frontend llama a `/refresh` (`features/auth/session-bootstrap.ts`), que devuelve el token y el usuario. Ante un 401, Axios renueva una sola vez y repite la petición; si falla, la sesión se cierra con un aviso.

| Endpoint | Uso | Estado |
|---|---|---|
| `POST /api/auth/register-taller` | Crea el taller y su admin | ✅ |
| `POST /api/auth/register` | Registro de cliente con `tallerPublicId` (se vincula si el taller ya lo tenía) | ✅ |
| `POST /api/auth/login` | Inicio de sesión | ✅ |
| `POST /api/auth/refresh` | Renovar la sesión con la cookie | ✅ |
| `POST /api/auth/logout` | Cerrar sesión | ✅ |
| `GET /api/auth/me` | Perfil + taller | ✅ |
| `GET /api/talleres/publicos` | Lista de talleres para el registro (`publicId`, nombre, dirección) | ✅ |

**Usuarios, clientes y motos (E5).** `:id` es siempre el `publicId`; otro taller o un id inválido → 404.

| Endpoint | Quién | Uso |
|---|---|---|
| `GET /api/usuarios?rol=` | admin | Equipo del taller (admins y mecánicos) |
| `POST /api/usuarios` | admin | Crear mecánico (rol y taller los pone el backend) |
| `PATCH /api/usuarios/:id` | admin | Nombre, teléfono o `estado` (activo / inactivo) de un mecánico |
| `GET /api/clientes?q=&page=&limit=` | admin, mecánico | Buscar por nombre, documento, teléfono o placa. `meta: { page, limit, total }` |
| `GET /api/clientes/:id` | admin, mecánico | Datos, motos y últimas 20 órdenes |
| `POST /api/clientes` | admin | Registrar cliente (409 si el documento ya existe en el taller) |
| `PATCH /api/clientes/:id` | admin | Nombre, teléfono, correo y dirección (el documento no cambia) |
| `GET /api/motos?cliente=&q=&page=` | todos | Cliente: solo las suyas. Cada moto trae `ordenActiva` o `null` |
| `POST /api/motos` | admin, cliente | El admin envía `clientePublicId`; el cliente no (queda a su nombre). 409 si la placa ya existe |
| `PATCH /api/motos/:id` | admin, cliente dueño | Editar datos de la moto |

## 8. Máquina de estados de la orden

```
registrada → diagnosticada → esperando_aprobacion → aprobada → en_reparacion → lista_entrega → entregada → cerrada
                                      └→ cancelada              ↕ pendiente_repuesto
(admin puede cancelar con motivo cualquier orden abierta)
```

| De → A | Quién |
|---|---|
| registrada → diagnosticada | mecánico asignado (al guardar el diagnóstico) |
| diagnosticada → esperando_aprobacion | admin o mecánico asignado |
| esperando_aprobacion → aprobada / cancelada | cliente dueño o admin |
| aprobada → en_reparacion | mecánico asignado |
| en_reparacion ↔ pendiente_repuesto, en_reparacion → lista_entrega | mecánico asignado |
| lista_entrega → entregada → cerrada | admin |
| cualquier estado abierto → cancelada (motivo obligatorio) | admin |

**Reglas:**
- Una transición inválida responde **409**.
- Cada cambio escribe en `historial_orden` dentro de la misma transacción.
- Los textos y colores de cada estado están en `frontend/src/lib/estados-orden.ts`.
- Las transiciones irán en `backend/src/modules/ordenes/estados.ts` (HU-28).

## 9. Sistema de diseño

| Token | Valor | Uso |
|---|---|---|
| `brand-navy` / `ink` | `#0B1F33` | Navegación, texto principal |
| `primary` | `#00B8D9` | Acción principal (texto encima en navy) |
| `primary-text` | `#007A91` | Texto cian sobre blanco |
| `accent` / `accent-text` | `#FF7A00` / `#B24F00` | Atención (máximo uno por pantalla) |
| `success` / `success-text` | `#1E9E67` / `#13744A` | Hecho, listo |
| `danger` | `#C0362F` | Errores, cancelar |
| `bg` / `surface` | `#F4F6F8` / `#FFFFFF` | Fondos |
| `ink-muted` | `#5A6B7D` | Texto secundario |
| `border` / `border-strong` | `#DDE3E9` / `#748391` | Bordes (el fuerte en campos) |
| `plate` | `#F7C600` | Solo la placa |

- **Tipografía:** Montserrat 600/700 para títulos; Inter 400/500/600 para la interfaz. Base de 16 px.
- **Radios:** 8 (`rounded-sm`), 12 (`rounded-md`), 20 (`rounded-lg`) y píldora.
- **Toque mínimo:** 48 px (`min-h-touch`, `size-touch`).
- **Navegación:** barra inferior en celular; menú lateral de 240 px desde 1024 px, con «Cerrar sesión» siempre visible.

## 10. Variables de entorno

El `.env` nunca se sube. Los valores se comparten con el equipo por fuera del repositorio.

**`backend/.env`:**
- `PORT`, `NODE_ENV`.
- `DATABASE_URL` (`mysql://usuario:clave@localhost:3306/mototrack`).
- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (≥ 32 caracteres).
- `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES=7d`.
- `CORS_ORIGIN=http://localhost:5173`.
- `TEST_DATABASE_URL` (debe terminar en `_test`).

**`frontend/.env`:** `VITE_API_URL=http://localhost:4000/api`.

## 11. Despliegue (aprobado el 9-oct, pendiente de hacer)

| Pieza | Dónde | Costo |
|---|---|---|
| Frontend + API | Un solo proyecto en Vercel Hobby (la API como función en `/api`, mismo dominio para que la cookie funcione) | Gratis |
| MySQL | Aiven, plan gratuito (1 GB), con `?ssl-mode=REQUIRED` | Gratis, sin tarjeta |

**Cuidados:**
- Vercel Hobby es solo para uso no comercial.
- Aiven apaga la base si no tiene actividad; hay que revisarla antes de cada presentación.
- Cualquier paso que pida pago se consulta antes.
