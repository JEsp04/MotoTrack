# Memoria.md · Estado actual y sesión activa

Memoria de trabajo del proyecto: dónde estamos, qué se está haciendo y qué hay que recordar.

- Se lee al **empezar** cada sesión.
- Se actualiza al **terminar**: estado, sesión activa y una línea nueva en la bitácora.
- Lo permanente (visión, stack) va en `contexto.md`; las reglas, en `CLAUDE.md`; las tareas, en `PROGRESS.md`; los criterios de aceptación del entregable, en `docs/HISTORIAS.md`; el diseño, en `docs/diseno.md` y `docs/prototipo/`.

Última actualización: sábado 24 de octubre de 2026.

---

## Estado actual

- **Avance del entregable (`docs/HISTORIAS.md`):** 47 de 50 historias en `develop` (106 de 112 puntos, ≈ 95 %). Falta **E7 · Despliegue y entrega (HU-38 a HU-40, 6 pts)**, que desde el 24-oct queda de última.
- **Segunda etapa (`docs/HISTORIAS-2.md`):** HU-51 a HU-75 (E8 a E11, 25 historias, 59 pts, sin costo) más HU-76 a HU-81 (E12, con costo, solo si se aprueban). Repartidas entre A, V y J en `docs/REPARTO.md`. Ninguna empezada.
- **Rama `develop`:** E0 a E6.5 unidas (HU-01 a HU-50), PR #4 a #25. Último commit: `e50feda Merge pull request #25 from JEsp04/HU-50` (24-oct).
  - PR #13: E6 · órdenes de servicio (`feature/ordenes`).
  - PR #14: guardián de tokens de color (`npm run check:tokens`).
  - PR #15: pruebas del backend sin mocks de Prisma (ESLint lo bloquea).
  - 16-oct: se borra el duplicado `docs/CONTEXTO.md`.
  - PR #16 a #25: E6.5 · migración al diseño nuevo, una rama por historia (`HU-41` … `HU-50`), unidas el 24-oct.
- **Backend funcionando:**
  - API en TypeScript con Prisma 7 y MySQL.
  - Auth completa, talleres públicos, equipo (`/usuarios`), `/clientes`, `/motos`, `/ordenes` y `/servicios`. `/api/health` ya existe (lo pide HU-39).
  - Hacia afuera solo `publicId` (UUIDv7); los `Int` son internos.
  - 91 pruebas contra MySQL real.
- **Frontend funcionando, con el diseño nuevo del prototipo aprobado el 17-oct:**
  - Fondo blanco y un solo acento amarillo; fuentes Geist y Michroma. Componentes `ui` nuevos: `HoldButton`, `Arc`, `Fab`, `IconButton`, `List`, `Note`, `Page`, `Segmented`, `SelectCard`, `Stepper`.
  - Barra inferior en celular y barra superior con menú del avatar en computador; rutas con `lazy`, 404 y error.
  - Landing del prototipo con ingreso y registro en un panel encima (HU-45).
  - Ingreso, registro, sesión al recargar y cierre de sesión.
  - Panel del taller, Clientes, Equipo, Órdenes y recibir moto, detalle de la orden con dial y «mantener presionado», seguimiento del cliente, perfil.
- **Base de datos:** 10 tablas; migraciones `20261010150000_inicial`, `20261012210000_public_id` y `20261012230000_public_id_servicios`, las tres en `develop`; seed con el taller Moto Express Laureles.
- **Aún no desplegado.** En el repositorio no existen `api/index.ts`, `vercel.json` ni la etiqueta `v0.1`, y `main` sigue en el commit inicial `b7b3c71`.

## Sesión activa

**Siguiente: Ronda 1 de la segunda etapa**, los tres en paralelo (guía paso a paso en `docs/FLUJO.md`, reparto en `docs/REPARTO.md`):

| Persona | Tema | Ronda 1 | Al final (E7) | Revisa a |
|---|---|---|---|---|
| **A** | Inventario y el día del mecánico | HU-51 → HU-52 → HU-53 | HU-38 · Aiven | V |
| **V** | Citas y la experiencia del cliente | HU-57 → HU-62 → HU-66 | HU-39 · Vercel | J |
| **J** | Avisos, reportes y ajustes del taller | HU-73 → HU-69 → HU-67 | HU-40 · Guion y `v0.1` | A |

- HU-51 (A) es la primera migración; V migra después de que se una. Avisar en el grupo antes de cada `db:migrate`.
- HU-73 (J) va primero porque el menú «Más» lo necesitan inventario (A) y citas (V) en la ronda 2.
- E7 se hace cuando las rondas 1 a 3 estén en `develop`. Aiven y Vercel: **pedir confirmación antes** de crear las cuentas.

**Pendiente de decidir:** fecha de cierre de las rondas y de E7; si el guion de HU-40 suma citas, repuestos, avisos y código de retiro; si se aprueba algún gasto de E12.

**Para probar lo que hay en tu PC:**
1. En tu copia del repositorio: `git checkout develop` y `git pull`; en `backend`: `npm install`, `npm run db:deploy` y `npm run seed`; en `frontend`: `npm install`.
2. `npm run dev` en las dos carpetas.
3. Admin `admin@mototrack.co`, mecánico `andres@mototrack.co`, cliente `juan@correo.co` (clave `MotoTrack2026`). Juan tiene la orden #2 esperando su aprobación (se aprueba manteniendo presionado).

## Decisiones vigentes

| Fecha | Decisión |
|---|---|
| 9-oct | Backend en TypeScript; Prisma reemplaza a Sequelize; MySQL 8 |
| 9-oct | 10 estados de orden; se quita el rol `recepcionista`; el cliente entra con correo y contraseña (OTP después) |
| 9-oct | Sesión: token de acceso en memoria + renovación en cookie `httpOnly`, con rotación |
| 9-oct | Despliegue aprobado: Vercel Hobby (frontend + API) + Aiven MySQL gratis |
| 9-oct | Alcance de la primera entrega: las 40 historias de `docs/HISTORIAS.md`; lo de «Fuera de esta entrega» va a la segunda |
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
| 12-oct | Colores solo con los tokens de `src/styles/index.css`; `npm run check:tokens` lo revisa en `npm test` y en GitHub (PR #14) |
| 12-oct | Pruebas del backend siempre contra MySQL real: prohibidos `vi.mock` y simuladores de Prisma; ESLint lo bloquea (PR #15) |
| 16-oct | Se borra `docs/CONTEXTO.md`: la fuente es `contexto.md` en la raíz, junto con `CLAUDE.md` |
| 17-oct | Se agrega **E6.5 · Migración al diseño** (HU-41 a HU-50, 24 pts) en `docs/HISTORIAS.md`. Va antes de E7. El entregable pasa a 50 historias y 112 puntos |
| 17-oct | Prototipo nuevo aprobado (https://claude.ai/artifact/M2oVJGvZ6oAqGJKattY41w, copia en `docs/prototipo/`). El diseño debe ser **idéntico** al prototipo; lo que la app aún no tiene se omite, no se inventa |
| 17-oct | Un solo fondo blanco y un solo acento amarillo; Geist para el texto y Michroma para marca, placas, números y montos. Cambiar el estado de una orden se confirma con `HoldButton` |
| 17-oct | Ramas `HU-<número>`, una por historia. Comandos para Git Bash en Windows (no PowerShell) |
| 24-oct | Segunda etapa: HU-51 a HU-81 en `docs/HISTORIAS-2.md`. **E7 queda de última**, después de HU-51 a HU-75. E12 (HU-76 a HU-81) solo con aprobación de gasto |
| 24-oct | Reparto por tema (`docs/REPARTO.md`): A inventario + HU-38, V citas y cliente + HU-39, J avisos y taller + HU-40. Revisiones cruzadas: A→V, V→J, J→A. Se puede cambiar si alguien prefiere front o back |

## Cosas a tener en cuenta

- **E7 atrasada:** la fecha de la primera entrega (17-oct) ya pasó sin despliegue, y ahora va después de las rondas 1 a 3. Confirmar la fecha nueva con el equipo.
- **Varias copias del repositorio:** cada integrante tiene la suya (por ejemplo `C:\Users\Paula\IUSH\MotoTrack`). Antes de empezar, `git pull origin develop` para arrancar del mismo punto. Si en un PC hay una copia vieja (Descargas), no se usa.
- **Enlaces rotos a `docs/CONTEXTO.md`:** `README.md` y `docs/HISTORIAS.md` (encabezado, «Definición de terminado» y el total) todavía lo nombran, y el total de `HISTORIAS.md` sigue diciendo 40 historias y 88 puntos. Hay que apuntarlos a `contexto.md` y a `CLAUDE.md`, sección 6.
- **La migración inicial se escribió a mano** porque el entorno de Claude no puede descargar el motor de Prisma. Se probó en MariaDB y Paula la aplicó en MySQL 8 con `prisma migrate reset` el 10-oct. Si algún compañero ve *drift* en una base sin datos: `npx prisma migrate reset`.
- **Bases viejas de Sequelize:** quien tenga tablas antiguas en `mototrack` debe hacer `npx prisma migrate reset`.
- **Landing page de un compañero:** la del prototipo ya quedó en `features/landing` (HU-45). Falta decidir si la del compañero se descarta.
- **GitHub abre los PR hacia `main` por defecto.** Ya pasó una vez (PR cerrado y rehecho). Siempre revisar que la base sea `develop`.
- **Windows y saltos de línea:** el repositorio guarda LF (`.gitattributes`). Si `package-lock.json` aparece modificado solo por `npm install`, se descarta.

## Bitácora de sesiones

| Fecha | Qué se hizo |
|---|---|
| 27-sep | Diseño: prototipo navegable, sistema de diseño, landing con membresías, registro por roles con OTP, pagos, citas, alertas IA (solo diseño) |
| 9-oct | Contexto y stack definidos (`docs/CONTEXTO.md`), auditoría del repositorio, despliegue elegido, 40 historias de usuario (`docs/HISTORIAS.md`) |
| 10-oct | E0 a E3 desarrolladas, revisadas y unidas en `develop` (PR #4 a #8). Base local reseteada con Prisma. Autores de commits corregidos |
| 12-oct | Creación de `CLAUDE.md`, `contexto.md`, `Memoria.md` y `PROGRESS.md`. E4 completa (HU-19 a HU-22) en `feature/auth-frontend`. La landing se retrasa porque un compañero está sin conexión. Rama `feature/validaciones-publicid`: `publicId` UUIDv7 y largo máximo en formularios. PR #10 y #11 unidos. E5 completa (HU-23 a HU-27), unida en el PR #12. E6 completa (HU-28 a HU-37) en `feature/ordenes` |
| 12-oct (noche) | PR #13 (E6), #14 (guardián de tokens) y #15 (pruebas sin mocks) unidos en `develop` |
| 16-oct | Se borra el duplicado `docs/CONTEXTO.md` (`22a4a7c`) |
| 17-oct | Prototipo nuevo aprobado, `docs/diseno.md` y E6.5 (HU-41 a HU-50) en `docs/HISTORIAS.md`. Desarrollo de E6.5 (17 y 18-oct) |
| 24-oct | PR #16 a #25 (E6.5) unidos en `develop`. `PROGRESS.md` y `Memoria.md` alineados con `docs/HISTORIAS.md`: E6 y E6.5 marcadas como unidas, avance 47/50 (106/112 pts), E7 desglosada por criterios de aceptación y fecha nueva pendiente |
| 24-oct (tarde) | Nuevas historias HU-51 a HU-81 (`docs/HISTORIAS-2.md`), reparto entre A, V y J (`docs/REPARTO.md`) y guía de sesión (`docs/FLUJO.md`). `PROGRESS.md` y `Memoria.md` sincronizados con el reparto; siguiente: Ronda 1 |
