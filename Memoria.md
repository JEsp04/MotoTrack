# Memoria.md · Estado actual y sesión activa

Memoria de trabajo del proyecto: dónde estamos, qué se está haciendo y qué hay que recordar.

- Se lee al **empezar** cada sesión.
- Se actualiza al **terminar**: estado, sesión activa y una línea nueva en la bitácora.
- Lo permanente (visión, stack) va en `contexto.md`; las reglas, en `CLAUDE.md`; las tareas, en `PROGRESS.md`.

Última actualización: lunes 12 de octubre de 2026 (noche).

---

## Estado actual

- **Rama `develop`:** E0 a E4 unidas (HU-01 a HU-22) y la mejora de `publicId` y largo máximo. PR #4 a #11. Último commit: `663b676 Merge pull request #11 from JEsp04/feature/validaciones-publicid`.
- **Backend funcionando:**
  - API en TypeScript con Prisma 7 y MySQL.
  - Auth completa: `register-taller`, `register`, `login`, `refresh`, `logout` y `me`.
  - `GET /talleres/publicos`.
  - Hacia afuera solo `publicId` (UUIDv7); los `Int` son internos.
- **Frontend funcionando:**
  - Sistema de diseño en Tailwind y 16 componentes `ui`; menú por rol, rutas con `lazy`, 404 y error.
  - Ingreso, registro (taller y cliente), sesión que sobrevive a recargar y cierre de sesión.
- **E5 terminada en la rama `feature/clientes-motos`** (falta revisión y PR a `develop`).
- **Todavía provisional:** las pantallas de órdenes (admin, mecánico y cliente) dicen «En construcción» hasta E6.
- **Base de datos:** 10 tablas; migraciones `20261010150000_inicial` y `20261012210000_public_id`; seed con el taller Moto Express Laureles.
- **Aún no desplegado** (Vercel + Aiven, E7).

## Sesión activa

**E5 lista para revisión** en `feature/clientes-motos` (sale de `develop` después del PR #11):
- **Backend:**
  - `/api/usuarios`: el admin crea mecánicos con contraseña temporal y los activa o desactiva. Al desactivar se cierran sus sesiones.
  - `/api/clientes`: crear, buscar (nombre, documento, teléfono o placa) con páginas de 20, ver detalle con motos y últimas órdenes, y editar.
  - `/api/motos`: crear y editar con placa colombiana normalizada (`ABC12D` o `ABC12`); el cliente solo ve y edita las suyas. Cada moto trae `ordenActiva`.
  - Validaciones compartidas en `src/utils/schemas.ts`.
  - **59 pruebas** (27 anteriores + 32 nuevas).
- **Frontend:**
  - Pantallas Equipo, Clientes (buscador con pausa de 300 ms, «Ver más» y esqueletos), detalle del cliente y Mis motos.
  - Formularios en hoja inferior (`BottomSheet`) con `maxLength`. Validaciones compartidas en `lib/validaciones.ts`.
  - **67 pruebas** (45 anteriores + 22 nuevas).
- **Prueba de punta a punta contra la API y MySQL** (celular y computador): crear y desactivar mecánico, mecánico desactivado no entra, buscar «xyz12», crear cliente y su moto, placa y documento repetidos, «Mis motos» del cliente con el estado de su orden.
- No hay migración nueva: basta con `npm install` y `npm run dev`.

**Pendiente de E5 para E6:** HU-26 alterno B (agregar una moto sin salir del formulario de la orden) se hace con HU-29.

**Siguiente: E6 · Órdenes de servicio (HU-28 a HU-37).**

**Para probar E5 en tu PC:**
1. `git checkout feature/clientes-motos`, luego `npm install` en `backend` y en `frontend`.
2. Si quieres datos limpios: `npm run seed` en `backend`.
3. Corre `npm run dev` en las dos carpetas y entra a `http://localhost:5173/login` con `admin@mototrack.co` / `MotoTrack2026` (o `juan@correo.co` para ver «Mis motos»).

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
| 12-oct | Creación de `CLAUDE.md`, `contexto.md`, `Memoria.md` y `PROGRESS.md`. E4 completa (HU-19 a HU-22) en `feature/auth-frontend`. La landing se retrasa porque un compañero está sin conexión. Rama `feature/validaciones-publicid`: `publicId` UUIDv7 y largo máximo en formularios. PR #10 y #11 unidos. E5 completa (HU-23 a HU-27) en `feature/clientes-motos` |
