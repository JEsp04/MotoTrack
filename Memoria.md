# Memoria.md · Estado actual y sesión activa

Memoria de trabajo del proyecto: dónde estamos, qué se está haciendo y qué hay que recordar.

- Se lee al **empezar** cada sesión.
- Se actualiza al **terminar**: estado, sesión activa y una línea nueva en la bitácora.
- Lo permanente (visión, stack) va en `contexto.md`; las reglas, en `CLAUDE.md`; las tareas, en `PROGRESS.md`.

Última actualización: lunes 12 de octubre de 2026 (tarde).

---

## Estado actual

- **Rama `develop`:** E0, E1, E2 y E3 unidas (HU-01 a HU-18), PR #4 a #8. Último commit: `e6ae0f3 Merge pull request #8 from JEsp04/feature/auth-sesion`.
- **Backend funcionando:**
  - API en TypeScript con Prisma 7 y MySQL.
  - Endpoints de auth completos: `register-taller`, `register`, `login`, `refresh`, `logout` y `me`.
  - `GET /talleres/publicos`.
  - 27 pruebas (antes se anotó «28» por error: eran 23; con `publicId` suman 4).
- **Frontend funcionando:**
  - Sistema de diseño en Tailwind y 16 componentes `ui`.
  - Menú por rol, rutas con `lazy` y páginas 404 y de error.
  - Cliente HTTP con renovación única.
  - 26 pruebas.
- **E4 terminada en la rama `feature/auth-frontend`** (falta revisión y PR a `develop`):
  - Ingreso y registro reales, conectados al backend.
  - La sesión sobrevive a recargar la página.
  - «Cerrar sesión» invalida la cookie en el backend.
  - Ya no existen los botones «entrar como…».
- **Todavía provisional:** las pantallas de admin, mecánico y cliente dicen «En construcción» hasta E5 y E6.
- **Base de datos:** 10 tablas, migración `20261010150000_inicial` y seed con un taller de ejemplo (Moto Express Laureles).
- **Aún no desplegado** (Vercel + Aiven, E7).

## Sesión activa

**E4 lista para revisión** en `feature/auth-frontend`:
- **Frontend:** 43 pruebas.
- **Prueba de punta a punta contra la API y MySQL:**
  - Ingreso con clave mala y con clave buena.
  - Recarga sin perder la sesión.
  - Cierre de sesión, y botón «atrás» sin volver a datos privados.
  - Registro de cliente que se vincula a su ficha existente.
  - Registro de taller.

**Rama `feature/validaciones-publicid`** (sale de `feature/auth-frontend`, se une después de ella):
- `publicId` UUIDv7 en talleres, usuarios, clientes, motocicletas y órdenes (migración `20261012210000_public_id`, rellena las filas existentes). Los `Int` se conservan.
- La API ya no responde `usuarioId` ni `tallerId`; el registro de cliente envía `tallerPublicId`.
- Largo máximo en todos los campos (Zod en backend y frontend) y `maxLength` en los inputs.
- Pruebas: backend 27, frontend 45.
- Hay que aplicar la migración: `npm run db:deploy` en `backend`.

**Siguiente: E5 · Usuarios, clientes y motos (HU-23 a HU-27).** Se puede trabajar el backend sin chocar con la landing.

**Para probar E4 en tu PC:**
1. Corre el backend con `npm run dev` y el frontend con `npm run dev`.
2. Entra a `http://localhost:5173/login` con `admin@mototrack.co` y la clave `MotoTrack2026`.

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
| 12-oct | Creación de `CLAUDE.md`, `contexto.md`, `Memoria.md` y `PROGRESS.md`. E4 completa (HU-19 a HU-22) en `feature/auth-frontend`. La landing se retrasa porque un compañero está sin conexión. Rama `feature/validaciones-publicid`: `publicId` UUIDv7 y largo máximo en formularios |
