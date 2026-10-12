# Memoria.md · Estado actual y sesión activa

Memoria de trabajo del proyecto: dónde estamos, qué se está haciendo y qué hay que recordar.

- Se lee al **empezar** cada sesión.
- Se actualiza al **terminar**: estado, sesión activa y una línea nueva en la bitácora.
- Lo permanente (visión, stack) va en `contexto.md`; las reglas, en `CLAUDE.md`; las tareas, en `PROGRESS.md`.

Última actualización: lunes 12 de octubre de 2026 (noche).

---

## Estado actual

- **Rama `develop`:** E0 a E5 unidas (HU-01 a HU-27) más la mejora de `publicId` y largo máximo. PR #4 a #12. Último commit: `87bc5c8 Merge pull request #12 from JEsp04/feature/clientes-motos`.
- **Backend funcionando:**
  - API en TypeScript con Prisma 7 y MySQL.
  - Auth completa, talleres públicos, equipo (`/usuarios`), `/clientes` y `/motos`.
  - Hacia afuera solo `publicId` (UUIDv7); los `Int` son internos.
- **Frontend funcionando:**
  - Sistema de diseño (16 componentes `ui`), menú por rol, rutas con `lazy`, 404 y error.
  - Ingreso, registro, sesión al recargar y cierre de sesión.
  - Equipo, Clientes (buscador, detalle) y Mis motos.
- **E6 terminada en la rama `feature/ordenes`** (falta revisión y PR a `develop`).
- **Base de datos:** 10 tablas; migraciones `20261010150000_inicial`, `20261012210000_public_id` y (en `feature/ordenes`) `20261012230000_public_id_servicios`; seed con el taller Moto Express Laureles.
- **Aún no desplegado** (Vercel + Aiven, E7).

## Sesión activa

**E6 lista para revisión** en `feature/ordenes` (sale de `develop` después del PR #12):
- **Backend:**
  - `ordenes/estados.ts`: las 10 transiciones y quién hace cada una. `cambiarEstado()` es la única función que cambia el estado y guarda el historial en la misma transacción (con control de concurrencia: si dos personas cambian a la vez, la segunda recibe 409).
  - `/api/ordenes`: crear (número consecutivo por taller, una orden abierta por moto, kilometraje no menor al último), listar por rol con `grupo` y `q`, detalle, cambio de estado, diagnóstico y servicios. `GET /api/servicios` (catálogo).
  - `publicId` en `servicios` y `detalle_servicios` (migración nueva).
  - **91 pruebas** (59 anteriores + 32 nuevas). Una prueba recorre las 100 combinaciones de estados: las permitidas pasan y las demás dan 409.
- **Frontend:**
  - `features/ordenes`: listas por rol con pestañas (Todas, En proceso, Por aprobar, Listas, Cerradas) y buscador; crear orden en 3 pasos (cliente → moto → datos), registrando cliente o moto nuevos ahí mismo (HU-26 alterno B y HU-29 alterno A); detalle con línea de tiempo y solo los botones del rol; confirmaciones en hoja inferior.
  - **83 pruebas** (67 anteriores + 16 nuevas).
- **Prueba de punta a punta contra la API y MySQL:** orden creada por el admin → diagnóstico urgente y 2 servicios ($ 70.000) por el mecánico → aprobación por teléfono → reparación con repuesto faltante → entrega → cierre (10 registros en el historial). Además, un cliente aprueba su orden desde la app.
- **Hay migración nueva:** después del `pull`, `npm install` y `npm run db:deploy` en `backend`.

**Siguiente: E7 · Despliegue y entrega (HU-38 a HU-40).** HU-38 y HU-39 implican crear cuentas en Aiven y Vercel (planes gratis): pedir confirmación antes.

**Para probar E6 en tu PC:**
1. `git checkout feature/ordenes`; en `backend`: `npm install`, `npm run db:deploy` y `npm run seed`; en `frontend`: `npm install`.
2. `npm run dev` en las dos carpetas.
3. Admin `admin@mototrack.co`, mecánico `andres@mototrack.co`, cliente `juan@correo.co` (clave `MotoTrack2026`). Juan tiene la orden #2 esperando su aprobación.

## Decisiones vigentes

| Fecha | Decisión |
|---|---|
| 9-oct | Backend en TypeScript; Prisma reemplaza a Sequelize; MySQL 8 |
| 9-oct | 10 estados de orden; se quita el rol `recepcionista`; el cliente entra con correo y contraseña (OTP después) |
| 9-oct | Sesión: token de acceso en memoria + renovación en cookie `httpOnly`, con rotación |
| 9-oct | Despliegue aprobado: Vercel Hobby (frontend + API) + Aiven MySQL gratis |
| 10-oct | Prisma 7 con `@prisma/adapter-mariadb`. No se usa Prisma 8: el 10-oct era una versión candidata (rc) |
| 10-oct | TypeScript 6.0 (typescript-eslint aún no soporta la 7) y React Router 7 |
| 10-oct | Citas, repuestos, inventario, IA y notificaciones **no** tienen tabla todavía (segunda entrega) |
| 10-oct | Los mecánicos no se registran solos: el admin les crea la cuenta (HU-23) |
| 10-oct | Commits a nombre del integrante (JEsp04), **sin** `Co-Authored-By` |
| 12-oct | Se crean `CLAUDE.md`, `contexto.md`, `Memoria.md` y `PROGRESS.md` en la raíz para no perder el hilo entre sesiones |
| 12-oct | Frontend: formularios con React Hook Form + Zod 4. Al abrir la app se recupera la sesión con `/auth/refresh`, que ya devuelve el usuario (no hace falta `/me`) |
| 12-oct | Los mecánicos no tienen opción de registro: la pantalla de registro les dice que se lo pidan al admin |
| 12-oct | Se conservan los `Int` como llaves y se agrega `publicId` (UUIDv7) en las 5 tablas que salen a la API. Hacia afuera solo `publicId`; el JWT sigue llevando los `Int` |
| 12-oct | Largo máximo en todos los campos y `maxLength` en los inputs. **No** se usan `helmet` ni `express-rate-limit` por ahora |
| 12-oct | No se versionan `.env.example`: los valores se comparten con el equipo por fuera |
| 12-oct | Las rutas usan el `publicId` en `:id` (`/clientes/:id`, `/motos/:id`, `/usuarios/:id`). Un id que no es UUID o es de otro taller responde 404. Las motos de un cliente se filtran con `?cliente=<publicId>` |
| 12-oct | Permisos E5: clientes los ve admin y mecánico, pero solo el admin los crea y edita; motos las crean y editan el admin y el cliente dueño, el mecánico solo consulta; el equipo es solo del admin |
| 12-oct | Al desactivar un mecánico se revocan sus tokens de renovación; su token de acceso vence solo (máximo 15 min) |
| 12-oct | Órdenes: el mecánico ve en su lista solo las asignadas, pero puede abrir cualquier orden del taller; actuar sobre una que no es suya da 403. El cliente solo ve las de sus motos (otra → 404) |
| 12-oct | Diagnóstico y servicios se editan solo en `registrada` y `diagnosticada`; desde `esperando_aprobacion` responden 409. El total lo calcula siempre el backend |
| 12-oct | Cuando el admin aprueba o rechaza por el cliente, el historial dice «El cliente aprobó/rechazó por teléfono (registrado por el taller)» |
| 12-oct | `publicId` también en `servicios` y `detalle_servicios`. HU-33 entra en la primera entrega. E6 en una sola rama `feature/ordenes` |
| 12-oct | En la API, `modelo` de la moto es el año (como se dice en Colombia) y `referencia` es el nombre comercial (NMAX 155) |

## Cosas a tener en cuenta

- **La migración inicial se escribió a mano** porque el entorno de Claude no puede descargar el motor de Prisma. Se probó en MariaDB y Paula la aplicó en MySQL 8 con `prisma migrate reset` el 10-oct. Si algún compañero ve *drift* en una base sin datos: `npx prisma migrate reset`.
- **Bases viejas de Sequelize:** quien tenga tablas antiguas en `mototrack` debe hacer `npx prisma migrate reset`.
- **Landing page de un compañero:** se hizo sobre la plantilla JSX anterior. Al hacer `pull` habrá conflictos. Plan: moverla a `pages/LandingPage.tsx` en una rama nueva.
- **GitHub abre los PR hacia `main` por defecto.** Ya pasó una vez (PR cerrado y rehecho). Siempre revisar que la base sea `develop`.
- **Windows y saltos de línea:** el repositorio guarda LF (`.gitattributes`). Si `package-lock.json` aparece modificado solo por `npm install`, se descarta.
- **`docs/CONTEXTO.md`** (del 9-oct) quedó reemplazado por `contexto.md` + `CLAUDE.md`. Pendiente decidir si se borra.

## Bitácora de sesiones

| Fecha | Qué se hizo |
|---|---|
| 27-sep | Diseño: prototipo navegable, sistema de diseño, landing con membresías, registro por roles con OTP, pagos, citas, alertas IA (solo diseño) |
| 9-oct | Contexto y stack definidos (`docs/CONTEXTO.md`), auditoría del repositorio, despliegue elegido, 40 historias de usuario (`docs/HISTORIAS.md`) |
| 10-oct | E0 a E3 desarrolladas, revisadas y unidas en `develop` (PR #4 a #8). Base local reseteada con Prisma. Autores de commits corregidos |
| 12-oct | Creación de `CLAUDE.md`, `contexto.md`, `Memoria.md` y `PROGRESS.md`. E4 completa (HU-19 a HU-22) en `feature/auth-frontend`. La landing se retrasa porque un compañero está sin conexión. Rama `feature/validaciones-publicid`: `publicId` UUIDv7 y largo máximo en formularios. PR #10 y #11 unidos. E5 completa (HU-23 a HU-27), unida en el PR #12. E6 completa (HU-28 a HU-37) en `feature/ordenes` |
