# gemini.md · Contexto de trabajo para Gemini / Antigravity en MotoTrack

Guía operativa propia para trabajar en **MotoTrack** alineada con la forma de trabajo del equipo. Complementa y respeta las fuentes oficiales del proyecto:

- Reglas obligatorias: [`CLAUDE.md`](./CLAUDE.md)
- Visión, roles, stack y arquitectura: [`contexto.md`](./contexto.md)
- Estado y bitácora de sesiones: [`Memoria.md`](./Memoria.md)
- Roadmap y estado de historias: [`PROGRESS.md`](./PROGRESS.md)
- Historias y criterios de aceptación: [`docs/HISTORIAS.md`](./docs/HISTORIAS.md) (E0–E7) y [`docs/HISTORIAS-2.md`](./docs/HISTORIAS-2.md) (E8–E12)
- Reparto y guía de sesión: [`docs/REPARTO.md`](./docs/REPARTO.md) y [`docs/FLUJO.md`](./docs/FLUJO.md)
- Diseño y prototipo: [`docs/diseno.md`](./docs/diseno.md) y [`docs/prototipo/mototrack-prototipo.html`](./docs/prototipo/mototrack-prototipo.html)

Última actualización de contexto: lunes 16 de noviembre de 2026.

---

## 1. Cómo debo trabajar en cada sesión

1. **Al empezar:** leer `Memoria.md`, `PROGRESS.md`, `gemini.md` y, si vamos a trabajar una historia, sus criterios en `docs/HISTORIAS-2.md` (o `docs/HISTORIAS.md` para E7) y su reparto en `docs/REPARTO.md`. Si toca pantallas, revisar `docs/diseno.md` y abrir esa pantalla en `docs/prototipo/mototrack-prototipo.html`.
2. **Idioma y tono:** responder **siempre en español** y explicar en lenguaje sencillo (el equipo está aprendiendo Prisma y TypeScript).
3. **Comandos:** cuando entregue comandos para que la usuaria los ejecute, darlos completos, en orden y para **Git Bash en Windows** (no PowerShell).
   - *Nota interna de entorno Windows:* al ejecutar comandos desde la terminal PowerShell del agente, usar `npm.cmd` en lugar de `npm` para evitar el bloqueo de ejecución de scripts `.ps1`.
4. **Permisos y dinero:** pedir permiso expreso antes de cualquier servicio pago o creación de cuenta en la nube (Aiven, Vercel, WhatsApp Business, almacenamiento, IA, pasarelas de pago). E12 (HU-76 a HU-81) está bloqueada salvo aprobación.
5. **Alcance:** preguntar antes de hacer cambios fuera del plan acordado en `PROGRESS.md` / `docs/REPARTO.md`.
6. **Git seguro:**
   - **Nunca** hacer `commit` ni `push` sin que se pida.
   - Autor del commit: el integrante que lo pida (por ejemplo `JEsp04 <Jhojan.espinosaa@comunidad.iush.edu.co>`). **Sin** líneas `Co-Authored-By` ni `Claude-Session`.
   - No tocar cambios locales sin commit de otra persona ni reescribir historia ya subida.
7. **Al cerrar una historia:** recordar o ejecutar (si se pide) la actualización de `Memoria.md` y `PROGRESS.md`, verificando antes todos los scripts de calidad.

---

## 2. Estado de Git y ramas (verificado 16-nov-2026)

- **Rama por defecto en GitHub:** ya fue cambiada a **`develop`** (confirmado el 16-nov-2026).
- **Convención de ramas:**
  - `develop`: rama de integración (todos los PRs van aquí).
  - `main`: entregas finales (solo recibe `develop` en hitos estables).
  - `HU-<número>`: una rama por historia desde `develop` actualizado (o desde la rama padre si depende de otra aún no integrada).
  - `fix/…`, `chore/…`, `docs/…`: trabajo que no es historia, desde `develop`.
- **Sincronización observada el 16-nov-2026:**
  - Los PRs #34 (`HU-73`), #35 (`HU-69`) y #36 (`HU-67` backend) se unieron a `main` el 15-nov, y luego el 16-nov se integraron con PR #40 (`main → develop`), PR #39 (`HU-67 → develop`, commit `d8a84bc`) y PR #41 (`develop → main`, commit `b939dc0`).
  - `origin/develop` (`d8a84bc`) y `origin/main` (`b939dc0`) tienen actualmente el **mismo contenido de archivos**.
  - En esta copia local, `develop` está al día (`d8a84bc`); `main` local quedó en `b7b3c71` (se sigue trabajando siempre sobre `develop`).
  - *Nota de estado local:* en `git status` figuran `frontend/package-lock.json` modificado por `npm install` y un `package-lock.json` sin rastrear en la raíz; no tocarlos salvo que el equipo pida limpiarlos.

---

## 3. Reglas técnicas y arquitectura del código

### Reglas generales

- TypeScript estricto (`any` prohibido; si es inevitable, comentar por qué).
- Prettier: comillas simples, punto y coma, coma final, 100 columnas, saltos de línea `LF`.
- Nombres del dominio en español (`tallerId`, `crearOrden`, `estadoNuevo`); términos técnicos en inglés permitidos (`handler`, `store`, `schema`). Mensajes de error claros en español (qué pasó y qué hacer).
- Dinero en pesos enteros (`Int`, sin decimales). Formato visual con `formatPesos`.
- Fechas guardadas en UTC; cálculos de días/horarios y visualización en hora de Colombia (`America/Bogota`, UTC−5).
- Placas en mayúsculas sin espacios (`ABC12D`), mostradas con `<Plate />`.

### Backend (`backend/` → `http://localhost:4000/api`)

- **Stack:** Node 22+, Express 5, TypeScript 6 (ESM + `NodeNext`), Prisma 7 (`@prisma/adapter-mariadb`), MySQL 8, Zod 4, `bcryptjs` (costo 12), JWT access (15 min) + refresh opaco (7 días en cookie `httpOnly`, `SameSite=Strict`, con rotación y revocación de sesiones por reutilización).
- **Estructura por módulo** en `src/modules/<modulo>/`: `*.routes.ts` (URL + `requireAuth`/`requireRole`), `*.controller.ts` (valida con Zod y responde), `*.service.ts` (lógica + Prisma, sin `req`/`res`), `*.schemas.ts`.
- **Imports ESM (`NodeNext`):** siempre con extensión `.js` aunque el archivo sea `.ts`.
- **Errores:** lanzar `HttpError` (`HttpError.notFound()`, `HttpError.conflict()`, `HttpError.badRequest()`, etc.). Express 5 captura errores en funciones `async` sin `try/catch` en controladores.
- **Formato de respuestas:**
  - Éxito: `{ data: ... }` · Listas: `{ data: [...], meta: { page, limit, total } }`
  - Error: `{ message, errors?: [{ field, message }] }`
- **Multi-taller y privacidad de IDs:**
  - Toda tabla/consulta de negocio filtra por `req.user.tallerId`. Recurso de otro taller o `publicId` inválido → **404** (no 403).
  - Hacia afuera solo `publicId` (UUIDv7); los `Int` autoincrementales solo viven en relaciones internas, consultas y JWT.
  - Nunca devolver `passwordHash`; usar `select` explícitos en Prisma.
  - Mismo `.max()` en Zod que el largo de la columna en `schema.prisma`.
- **Órdenes y avisos:** `cambiarEstado()` en `src/modules/ordenes/ordenes.service.ts` valida contra `estados.ts` (debe coincidir con `frontend/src/features/ordenes/estados.ts`) y escribe `HistorialOrden` y `Aviso` (HU-69) dentro de la misma transacción.
- **Base de datos y pruebas:**
  - Usar siempre la instancia única `prisma` (`src/config/prisma.ts`) y `env` (`src/config/env.ts`).
  - Migraciones: `npm run db:migrate -- --name descripcion_corta`. **Nunca** editar una migración ya subida a `develop`. `src/generated/` no va a git.
  - Pruebas contra MySQL real (`TEST_DATABASE_URL`, debe terminar en `_test`) con Vitest + Supertest. **Prohibido** mockear Prisma (`vi.mock`, `vi.spyOn(prisma...)`, etc.); ESLint lo bloquea.
  - *Nota de sandbox:* para correr `npm test` del backend desde el agente se requiere acceso a `localhost:3306` fuera del sandbox.
- **Módulos ya implementados en `backend/src/modules/`:** `auth`, `avisos`, `citas`, `clientes`, `invitaciones`, `motos`, `ordenes`, `repuestos`, `servicios`, `talleres`, `usuarios`.
- **Migraciones aplicadas en `backend/prisma/migrations/`:** `inicial`, `public_id`, `public_id_servicios`, `inventario`, `citas`, `fecha_estimada_entrega`, `codigo_retiro`, `avisos`, `invitaciones`.

### Frontend (`frontend/` → `http://localhost:5173`)

- **Stack:** React 19, Vite 8, TypeScript 6, React Router 7 (`lazy`), TanStack Query 5 + Axios (`@/lib/http`), React Hook Form + Zod 4, Zustand 5 (solo sesión e interfaz; token de acceso **solo en memoria**, nunca en `localStorage`/`sessionStorage`), Tailwind CSS 4.
- **Capas estrictas (ESLint):** `pages → features → components/ui, components/layout → lib, types`.
- **Features:** `features/<nombre>/` con `api/`, `hooks/`, `components/`, `store/`, `schemas/` e `index.ts`.
- **Formularios:** React Hook Form + `zodResolver`, límites en `LIMITES` (`@/lib/validaciones`) con `maxLength`, errores de API aplicados con `aplicarErroresDeCampo`. En computador, máximo `760 px` (`max-w-form`).
- **Diseño idéntico al prototipo:**
  - *Mobile first*: diseñar a `390 px` primero y adaptar a `1280 px`/`1440 px` sin scroll horizontal.
  - Fondo blanco único (`#FFFFFF`), superficies `surface-sunken` (`#F5F5F7`) / `surface-2` (`#ECEDF0`), tinta `#16191D` (`primary`), único acento amarillo `#F5C400` (`accent` / `plate`; sobre blanco usar `accent-text` `#7A5900`), rojo solo peligro (`danger`), verde solo chip «hecho» (`success`).
  - **Prohibido** usar colores escritos a mano, paleta por defecto de Tailwind o valores arbitrarios. Validar siempre con `npm run check:tokens`.
  - Fuentes: `font-sans` (Geist) para texto; `font-num` (Michroma) solo para marca, placas, números grandes y montos.
  - Componentes en `@/components/ui`: reutilizar siempre (`Button`, `HoldButton`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `StatusBadge`, `Plate`, `Arc`, `Dial`, `AppBar`, `BottomSheet`, `Tabs`, `EmptyState`, `Skeleton`, `Toaster`, etc.).
  - Cambios de estado de órdenes: confirmar con `HoldButton` (directo o dentro de hoja cuando pide texto/código obligatorio).
  - Accesibilidad: área táctil mínima de `48 px` (`min-h-touch`), etiqueta en todo campo, `aria-invalid`, foco visible y respeto a `prefers-reduced-motion`.
  - Catálogo visual solo en desarrollo: `/dev/ui`.

---

## 4. Decisiones de negocio y UX confirmadas

Además de las «Decisiones vigentes» de `Memoria.md`, la usuaria confirmó el **16-nov-2026**:

1. **Alta de mecánicos y administradores solo por invitación con código (HU-67):**
   - La cuenta administrativa del taller es quien invita y comparte el código (p. ej., enlace `wa.me` o código de 4 caracteres).
   - En `EquipoPage.tsx`, el botón principal (`Fab`) es **«Invitar»** (`/admin/equipo/invitar`) porque los mecánicos solo entran por invitación con código.
   - Al validar el código en `/unirse` o `/i/:codigo` (`UnirseTaller`), en el formulario de registro se deben **cargar los datos almacenados de la invitación** (`nombre`, `telefono` en solo lectura, `email` si se guardó, rol y taller) y el invitado **rellena los faltantes** (correo si falta, contraseña y términos).
   - *Observación técnica para tener en cuenta:* en `EquipoPage.tsx` todavía queda `NuevoMecanicoSheet` en el `EmptyState` cuando `mecanicos.length === 0` (probado por `equipo.test.tsx`); no tocarlo salvo que el equipo decida retirarlo también del estado vacío.
2. **Rutas actuales conservadas:**
   - Mantener las rutas actuales tal como están (incluyendo `/admin/mas`, `/admin/taller` y el comportamiento actual de redirección al guardar en `DatosTallerForm`).
3. **Dato de teléfono y privacidad frente al mecánico y en invitaciones (implementado en rama `fix/privacidad-telefono`):**
   - El `mecanico` no recibe el `telefono` del cliente en `GET /api/ordenes/:id` ni en `GET /api/citas`, no ve la tarjeta `Cliente` en `OrdenDetalleVista.tsx`, y `/api/clientes` queda restringido a `admin` (`contexto.md`: el mecánico no ve clientes).
   - En la consulta pública `GET /api/invitaciones/codigo/:codigo`, el `telefono` se devuelve enmascarado (últimos 4 dígitos, ej. `••••••4471`), mientras `POST /api/auth/register-invitacion` toma el número real de la base de datos. `backend/src/app.ts` configura `trust proxy` en `1`.

---

## 5. Estado real de avance (16-nov-2026)

### Quién es quién en `docs/REPARTO.md`
- **A = Azulaw:** Inventario, día del mecánico (HU-51 a HU-56, HU-64, HU-68) y HU-38 (Aiven).
- **V:** Citas y experiencia del cliente (HU-57 a HU-63, HU-65, HU-66) y HU-39 (Vercel).
- **J:** Avisos, reportes y ajustes del taller (HU-67, HU-69 a HU-75) y HU-40 (guion y `v0.1`).

### Primera etapa (`docs/HISTORIAS.md`)
- **47 de 50 historias unidas en `develop`.**
- Solo falta **E7 · Despliegue y entrega** (HU-38 Aiven, HU-39 Vercel Hobby, HU-40 prueba E2E y tag `v0.1`), que va **al final de la segunda etapa sin costo**.

### Segunda etapa (`docs/HISTORIAS-2.md` y `docs/REPARTO.md`)

- **Ronda 1 — COMPLETADA y unida en `develop`:**
  - **A (Inventario):** HU-51 (tablas `repuestos` y `movimientos_stock`), HU-52 (API `/api/repuestos`), HU-53 (movimientos `entrada`/`salida`/`ajuste` con `FOR UPDATE`). *(PR #27–#29)*
  - **V (Citas y cliente):** HU-57 (tabla `citas` y `/api/citas` con horario del taller en bloques de 30 min), HU-62 (`fechaEstimadaEntrega` + `atrasada`), HU-66 (`codigoRetiro` de 4 dígitos + retiro sin reparación). *(PR #30, #32, #33)*
  - **J (Avisos y taller):** HU-73 (`GET/PATCH /api/talleres/mio`, `/admin/mas`, `/admin/taller`), HU-69 (tabla `avisos`, creación automática en transacción con `cambiarEstado` y `crearOrden`, `/api/avisos`), HU-67 (tabla `invitaciones`, `/api/invitaciones`, `/api/auth/register-invitacion`, `/admin/equipo/invitar`, `/unirse`, `/i/:codigo`). *(PR #34, #35, #36, #39)*
- **Ronda 2 — SIGUIENTE (Pantallas principales):**
  - **A:** HU-54 (pantalla `/admin/inventario`) → HU-55 (`/admin/inventario/nuevo`) → HU-64 (Inicio del mecánico `/mecanico` y `/mecanico/ordenes`).
  - **V:** HU-58 (agenda `/admin/citas`) → HU-59 (`/cliente/citas/nueva`) → HU-60 (Mis citas del cliente).
  - **J:** HU-70 (campana y pantalla de avisos) → HU-71 (reportes del taller) → HU-72 (exportar reporte a Excel CSV).
- **Ronda 3 — Integración:**
  - **A:** HU-68 (WhatsApp sin costo `wa.me` — J la necesita para HU-75) → HU-56 (repuestos en cotización).
  - **V:** HU-61 (ficha e historial de moto — J la necesita para HU-75) → HU-63 (reasignar mecánico) → HU-65 (Inicio del cliente).
  - **J:** HU-74 (tema oscuro) → HU-75 (recordatorios de mantenimiento por reglas).
- **E12 (HU-76 a HU-81):** funciones con costo, no iniciar sin aprobación.

*Nota documental:* `PROGRESS.md` y el bloque «Estado actual» de `Memoria.md` tienen pendientes por actualizar a `[x]` las historias HU-62, HU-66, HU-67, HU-69 y HU-73 (ya unidas en `develop`), así como algunos enlaces viejos a `docs/CONTEXTO.md` en `README.md`, `docs/HISTORIAS.md` y `backend/prisma/schema.prisma`.

---

## 6. Verificación, pruebas y datos locales

### Última corrida en verde (16-nov-2026 sobre `fix/privacidad-telefono`)

- **Frontend:** `format:check`, `check:tokens` (4 pruebas), `lint`, `typecheck`, `build` y `vitest` (**13 archivos, 125 pruebas**).
- **Backend:** `format:check`, `lint`, `typecheck`, `build` y `vitest` contra MySQL real `mototrack_test` (**13 archivos, 176 pruebas**).

### Lista de verificación antes de dar una historia por terminada

```bash
# Backend
cd backend
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build

# Frontend
cd ../frontend
npm run format:check && npm run check:tokens && npm run lint && npm run typecheck && npm test && npm run build
```

### Datos de prueba del seed (`backend/prisma/seed.ts`)

- **Contraseña de todas las cuentas:** `MotoTrack2026`
- **Admin:** `admin@mototrack.co` (Carolina Restrepo · Moto Express Laureles)
- **Mecánicos:** `andres@mototrack.co` (Andrés Gómez), `felipe@mototrack.co` (Felipe Ríos)
- **Clientes:** `laura@correo.co` (Laura Martínez), `juan@correo.co` (Juan Pablo Ochoa, orden #2 esperando aprobación) · cliente sin cuenta: Sofía Cardona (orden #6 lista para entrega con código `4821`)
- **Invitaciones de ejemplo:** `8Q2K` (pendiente válida), `X7PL` (vencida), `K9ZD` (cancelada)

### Inspección visual en navegador (Chrome DevTools)

- Si se va a usar el subagente de navegador sobre `http://localhost:5173`, Chrome debe tener habilitada la depuración remota (`chrome://inspect/#remote-debugging`) para exponer `DevToolsActivePort`.
