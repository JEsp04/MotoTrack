# MotoTrack · Historias de usuario de la primera entrega

> Lista de tareas de la primera entrega (**viernes 17 de octubre de 2026**).
> Se apoya en [`CONTEXTO.md`](./CONTEXTO.md): alcance, stack, estados, convenciones y calendario.
> Última actualización: 9 de octubre de 2026.

---

## Cómo leer este documento

Cada historia trae:

- **Historia:** *Como* [rol] *quiero* [acción] *para* [beneficio].
- **Ficha:** etapa, fecha, rama, prioridad, estimación y dependencias.
- **Casos de uso:** flujo principal (lo normal) y flujos alternos (errores o caminos distintos).
- **Criterios de aceptación:** escritos como *Dado / Cuando / Entonces*. La historia solo se cierra cuando **todos** se cumplen y además se cumple la *Definición de terminado* (CONTEXTO.md, sección 12).

**Prioridad**
- **Obligatoria:** sin ella no hay entrega.
- **Deseable:** entra si hay tiempo; si no, pasa a la segunda entrega.

**Estimación en puntos:** 1 (horas) · 2 (medio día) · 3 (un día) · 5 (dos días) · 8 (debe partirse).

**Roles:** `admin` (dueño o jefe del taller), `mecanico`, `cliente`, y `equipo` (nosotros como desarrolladores, en las historias técnicas).

**Sugerencia:** crear un *issue* de GitHub por historia, con su ID en el título (por ejemplo `HU-15 Iniciar sesión`), y mencionarlo en el PR (`Cierra #12`).

---

## Resumen

| ID | Historia | Etapa | Fecha | Prioridad | Pts |
|---|---|---|---|---|---|
| **E0 · Preparación del repositorio** |||||
| HU-01 | Limpiar el repositorio | 0 | 10 oct | Obligatoria | 1 |
| HU-02 | Backend en TypeScript | 0 | 10 oct | Obligatoria | 3 |
| HU-03 | Frontend en TypeScript con estructura modular | 0 | 10 oct | Obligatoria | 2 |
| HU-04 | Calidad de código y revisión automática | 0 | 10 oct | Obligatoria | 2 |
| HU-05 | Variables de entorno documentadas | 0 | 10 oct | Obligatoria | 1 |
| **E1 · Base de datos** |||||
| HU-06 | Esquema Prisma y migración inicial | 1 | 11–12 oct | Obligatoria | 5 |
| HU-07 | Datos de ejemplo | 1 | 12 oct | Obligatoria | 2 |
| **E2 · Base del frontend** |||||
| HU-08 | Tokens de diseño en Tailwind | 2 | 11 oct | Obligatoria | 1 |
| HU-09 | Componentes ui reutilizables | 2 | 11–12 oct | Obligatoria | 5 |
| HU-10 | Layouts y navegación por rol | 2 | 12–13 oct | Obligatoria | 3 |
| HU-11 | Rutas, carga diferida y página 404 | 2 | 12 oct | Obligatoria | 2 |
| HU-12 | Cliente HTTP y manejo de errores | 2 | 13 oct | Obligatoria | 2 |
| **E3 · Autenticación en backend** |||||
| HU-13 | Registrar un taller con su administrador | 2 | 12 oct | Obligatoria | 3 |
| HU-14 | Registrarme como cliente | 2 | 12 oct | Obligatoria | 2 |
| HU-15 | Iniciar sesión | 2 | 12 oct | Obligatoria | 2 |
| HU-16 | Mantener la sesión abierta (renovación) | 2 | 13 oct | Obligatoria | 3 |
| HU-17 | Cerrar sesión | 2 | 13 oct | Obligatoria | 1 |
| HU-18 | Ver mi perfil y proteger por rol | 2 | 13 oct | Obligatoria | 2 |
| **E4 · Autenticación en frontend** |||||
| HU-19 | Pantalla de inicio de sesión | 3 | 14 oct | Obligatoria | 2 |
| HU-20 | Pantallas de registro | 3 | 14 oct | Obligatoria | 3 |
| HU-21 | Sesión que sobrevive a recargar la página | 3 | 14 oct | Obligatoria | 2 |
| HU-22 | Acceso según mi rol y botón de salir | 3 | 14 oct | Obligatoria | 2 |
| **E5 · Usuarios, clientes y motos** |||||
| HU-23 | Crear cuentas de mecánico | 4 | 14 oct | Obligatoria | 2 |
| HU-24 | Registrar un cliente en el taller | 4 | 14 oct | Obligatoria | 2 |
| HU-25 | Buscar y ver clientes | 4 | 15 oct | Obligatoria | 2 |
| HU-26 | Registrar una moto | 4 | 15 oct | Obligatoria | 3 |
| HU-27 | Ver mis motos como cliente | 4 | 15 oct | Obligatoria | 1 |
| **E6 · Órdenes de servicio** |||||
| HU-28 | Motor de estados e historial (backend) | 5 | 15 oct | Obligatoria | 3 |
| HU-29 | Crear una orden de servicio | 5 | 15 oct | Obligatoria | 3 |
| HU-30 | Ver la lista de órdenes | 5 | 15 oct | Obligatoria | 2 |
| HU-31 | Ver el detalle y el historial de una orden | 5 | 16 oct | Obligatoria | 2 |
| HU-32 | Registrar el diagnóstico | 5 | 16 oct | Obligatoria | 2 |
| HU-33 | Agregar servicios y calcular el costo | 5 | 16 oct | Deseable | 3 |
| HU-34 | Aprobar o rechazar el diagnóstico | 5 | 16 oct | Obligatoria | 2 |
| HU-35 | Avanzar la reparación | 5 | 16 oct | Obligatoria | 2 |
| HU-36 | Entregar y cerrar la orden | 5 | 16 oct | Obligatoria | 1 |
| HU-37 | Cancelar una orden con motivo | 5 | 16 oct | Obligatoria | 1 |
| **E6.5 · Migración al diseño nuevo** |||||
| HU-41 | Colores y fuentes nuevos | 6.5 | Por definir | Obligatoria | 2 |
| HU-42 | Componentes base con el diseño nuevo | 6.5 | Por definir | Obligatoria | 3 |
| HU-43 | Botón de mantener presionado y arco de progreso | 6.5 | Por definir | Obligatoria | 2 |
| HU-44 | Navegación nueva | 6.5 | Por definir | Obligatoria | 3 |
| HU-45 | Ingreso y registro con el diseño nuevo | 6.5 | Por definir | Obligatoria | 2 |
| HU-46 | Panel del taller, clientes y equipo | 6.5 | Por definir | Obligatoria | 3 |
| HU-47 | Lista de órdenes y recibir moto | 6.5 | Por definir | Obligatoria | 2 |
| HU-48 | Detalle de la orden con mantener presionado | 6.5 | Por definir | Obligatoria | 3 |
| HU-49 | Seguimiento del cliente | 6.5 | Por definir | Obligatoria | 3 |
| HU-50 | Perfil, páginas de error y revisión final | 6.5 | Por definir | Obligatoria | 1 |
| **E7 · Despliegue y entrega** |||||
| HU-38 | Base de datos en la nube (Aiven) | — | 15 oct | Obligatoria | 1 |
| HU-39 | Publicar la app en Vercel | — | 16 oct | Obligatoria | 3 |
| HU-40 | Prueba de punta a punta y versión v0.1 | — | 16 oct | Obligatoria | 2 |

**Total:** 40 historias, 88 puntos (alrededor de 29 por integrante). Es justo para 7 días; por eso HU-33 es *deseable* y se aplica el plan de riesgo de CONTEXTO.md (sección 14).

**E6.5 (migración al diseño, agregada el 17-oct):** 10 historias más (HU-41 a HU-50), 24 puntos. Se hace antes de E7.

**Ruta crítica:** HU-01 → HU-02 → HU-06 → HU-13/15/16 → HU-21 → HU-29 → HU-28 → HU-34/35 → HU-39 → HU-40.

---

## E0 · Preparación del repositorio

### HU-01 · Limpiar el repositorio

**Historia:** Como **equipo**, quiero un repositorio sin dependencias subidas y con scripts que funcionen, para que cualquiera clone el proyecto y lo arranque sin errores ni conflictos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 0 | 10 oct | `chore/limpieza-repo` | Obligatoria | 1 | — |

**Casos de uso**
- *Principal:*
  1. Un integrante saca `backend/node_modules` del seguimiento con `git rm -r --cached backend/node_modules`.
  2. Agrega un `.gitignore` en la raíz (`node_modules/`, `.env`, `dist/`, `coverage/`, `.vercel/`).
  3. Corrige los scripts del backend para que apunten a la entrada real.
  4. Abre el PR hacia `develop`.
- *Alterno A, cambios locales sin commit:* antes de empezar, quien tenga cambios pendientes (por ejemplo, los archivos de auth) los guarda en su propia rama o los sube. Nadie borra trabajo ajeno.
- *Alterno B, conflicto al unir:* quien abrió el PR actualiza su rama con `develop`, resuelve y vuelve a pedir revisión.

**Criterios de aceptación**
- **Dado** un clon nuevo del repositorio, **cuando** se lista su contenido, **entonces** no existe `backend/node_modules` en git.
- **Dado** el clon, **cuando** se ejecuta `npm install` y luego `npm run dev` en `backend`, **entonces** el servidor arranca sin «module not found».
- **Dado** un archivo `.env` local, **cuando** se ejecuta `git status`, **entonces** el `.env` no aparece.

---

### HU-02 · Backend en TypeScript

**Historia:** Como **equipo**, quiero el backend en TypeScript con la estructura por módulos, para detectar errores antes de ejecutar y compartir tipos claros.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 0 | 10 oct | `chore/typescript` | Obligatoria | 3 | HU-01 |

**Casos de uso**
- *Principal:*
  1. Se instalan `typescript`, `tsx` y los tipos (`@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/cookie-parser`).
  2. Se crea `tsconfig.json` en modo estricto y ESM.
  3. Se reorganiza en `src/modules/<modulo>/` y se crean `server.ts` y `src/app.ts`.
  4. Los scripts quedan así: `dev` (tsx watch), `build` (tsc), `start` (node dist).
- *Alterno, código JS que aún no se migra:* los modelos de Sequelize no se migran a TS; se eliminan cuando Prisma esté listo (HU-06).

**Criterios de aceptación**
- **Dado** el backend, **cuando** se ejecuta `npm run build`, **entonces** compila sin errores y genera `dist/`.
- **Dado** el servidor en marcha, **cuando** se pide `GET /api/health`, **entonces** responde 200 con `{ "data": { "status": "ok" } }`.
- **Dado** `tsconfig.json`, **cuando** se revisa, **entonces** tiene `"strict": true`.
- **Dado** `app.ts`, **cuando** se revisa CORS, **entonces** solo acepta el origen de `CORS_ORIGIN` con `credentials: true`.

---

### HU-03 · Frontend en TypeScript con estructura modular

**Historia:** Como **equipo**, quiero el frontend en TypeScript con carpetas `pages`, `router`, `components/ui`, `features` y `types`, para que cada funcionalidad quede encapsulada y sea fácil repartir trabajo.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 0 | 10 oct | `chore/typescript` | Obligatoria | 2 | HU-01 |

**Casos de uso**
- *Principal:*
  1. Se renombran los archivos a `.tsx` y `.ts`.
  2. Se agrega `tsconfig` estricto con el alias `@/` hacia `src/`.
  3. Se borra el contenido de la plantilla de Vite.
  4. Se crean las carpetas de CONTEXTO.md (sección 5), cada una con un `index.ts`.
- *Alterno, alias que no resuelve:* se configura igual en `vite.config.ts` y en `tsconfig`.

**Criterios de aceptación**
- **Dado** el frontend, **cuando** se ejecuta `npm run build`, **entonces** `tsc` y Vite terminan sin errores.
- **Dado** un archivo de `features/`, **cuando** importa algo con `@/components/ui`, **entonces** funciona.
- **Dado** el proyecto, **cuando** se busca `App.css`, el logo de Vite o el contador de la plantilla, **entonces** ya no existen.

---

### HU-04 · Calidad de código y revisión automática

**Historia:** Como **equipo**, quiero formato, lint y pruebas automáticas en cada PR, para que el código de los 3 se vea igual y nada roto llegue a `develop`.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 0 | 10 oct | `chore/typescript` | Obligatoria | 2 | HU-02, HU-03 |

**Casos de uso**
- *Principal:*
  1. Se configuran ESLint y Prettier en front y back, con los scripts `lint`, `format` y `test` (Vitest).
  2. Se agrega una revisión automática en GitHub Actions que corre lint, pruebas y build en cada PR hacia `develop`.
  3. Se protege `develop` para exigir 1 revisión y la revisión automática en verde.
- *Alterno, revisión automática en rojo:* el PR no se puede unir hasta corregir.

**Criterios de aceptación**
- **Dado** un PR hacia `develop`, **cuando** se abre, **entonces** la revisión automática corre lint, pruebas y build de front y back.
- **Dado** un PR con un error de lint, **cuando** termina la revisión, **entonces** queda en rojo y no se puede unir.
- **Dado** el repositorio, **cuando** se ejecuta `npm test` en cada parte, **entonces** corre al menos una prueba de ejemplo en verde.

> GitHub Actions es gratuito dentro del cupo mensual del plan gratuito; este uso no genera costo.

---

### HU-05 · Variables de entorno documentadas

**Historia:** Como **integrante nuevo**, quiero un `.env.example` con todas las variables, para configurar mi entorno en minutos sin preguntar.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 0 | 10 oct | `chore/limpieza-repo` | Obligatoria | 1 | HU-01 |

**Casos de uso**
- *Principal:*
  1. Se crean `backend/.env.example` y `frontend/.env.example` con las variables de CONTEXTO.md (sección 10), sin valores secretos.
  2. Se crea `backend/src/config/env.ts`, que valida las variables con Zod al arrancar.
- *Alterno, falta una variable:* el servidor no arranca y dice cuál falta.

**Criterios de aceptación**
- **Dado** un `.env` sin `JWT_ACCESS_SECRET`, **cuando** arranca el backend, **entonces** se detiene con un mensaje que nombra la variable.
- **Dado** el repositorio, **cuando** se buscan secretos reales, **entonces** no hay ninguno, solo ejemplos.

---

## E1 · Base de datos

### HU-06 · Esquema Prisma y migración inicial

**Historia:** Como **equipo**, quiero el modelo de datos en Prisma con una migración inicial, para que todos tengamos la misma base de datos y consultas con tipos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 1 | 11–12 oct | `feature/prisma` | Obligatoria | 5 | HU-02 |

**Casos de uso**
- *Principal:*
  1. Se instala Prisma.
  2. Se escribe `schema.prisma` con: `Taller`, `Usuario` (roles admin, mecanico y cliente), `Cliente`, `Moto`, `OrdenServicio` (enum de 10 estados), `HistorialOrden`, `Diagnostico`, `Servicio`, `DetalleServicio` y `RefreshToken`.
  3. Se ejecuta `prisma migrate dev --name inicial`.
  4. Se crea `src/config/prisma.ts` con una sola instancia del cliente.
- *Alterno A, tablas fuera de alcance:* `Cita`, `Repuesto`, `MovimientoInventario`, `RecomendacionIA` y `Notificacion` pueden quedar definidas, pero no se exponen en la API de esta entrega.
- *Alterno B, se elimina Sequelize:* al terminar, se quitan los modelos, `sequelize` y su configuración.

**Criterios de aceptación**
- **Dado** una base MySQL vacía, **cuando** se ejecuta `npx prisma migrate deploy`, **entonces** se crean todas las tablas sin errores.
- **Dado** el esquema, **cuando** se revisa el rol de `Usuario`, **entonces** solo admite `admin`, `mecanico` y `cliente`.
- **Dado** el esquema, **cuando** se revisa el estado de `OrdenServicio`, **entonces** tiene los 10 estados de CONTEXTO.md (sección 7).
- **Dado** el esquema, **cuando** se revisan `Usuario`, `Cliente`, `Moto` y `OrdenServicio`, **entonces** todos tienen `tallerId`.
- **Dado** el esquema, **cuando** se revisa `Moto`, **entonces** la placa es única dentro de cada taller (`@@unique([tallerId, placa])`), y el correo de `Usuario` es único.
- **Dado** el esquema, **cuando** se revisa el dinero, **entonces** se guarda en pesos enteros (`Int`).
- **Dado** el backend, **cuando** se busca `sequelize`, **entonces** ya no aparece.

---

### HU-07 · Datos de ejemplo

**Historia:** Como **equipo**, quiero un comando que llene la base con datos de prueba, para desarrollar y presentar sin crear todo a mano.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 1 | 12 oct | `feature/prisma` | Obligatoria | 2 | HU-06 |

**Casos de uso**
- *Principal:* `npm run seed` crea:
  - 1 taller.
  - 1 admin, 2 mecánicos y 3 clientes, con contraseñas cifradas.
  - 4 motos.
  - Un catálogo de unos 8 servicios con precio.
  - 5 órdenes en estados distintos, con su historial.
- *Alterno, ya hay datos:* el seed limpia y vuelve a crear, solo cuando `NODE_ENV` no es `production`.

**Criterios de aceptación**
- **Dado** una base recién migrada, **cuando** se ejecuta `npm run seed`, **entonces** existen los datos descritos y se puede iniciar sesión con las cuentas de prueba anotadas en el README.
- **Dado** `NODE_ENV=production`, **cuando** se ejecuta el seed, **entonces** se niega y no borra nada.

---

## E2 · Base del frontend

### HU-08 · Tokens de diseño en Tailwind

**Historia:** Como **equipo de frontend**, quiero los colores, fuentes, radios y espaciados de MotoTrack como clases de Tailwind, para que todas las pantallas se vean como el prototipo sin copiar valores a mano.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 11 oct | `feature/frontend-base` | Obligatoria | 1 | HU-03 |

**Casos de uso**
- *Principal:*
  1. Se instala Tailwind v4 con su plugin de Vite.
  2. Se definen en `@theme` los tokens de CONTEXTO.md (sección 9).
  3. Se cargan Montserrat 600/700 e Inter.
- *Alterno, color con poco contraste:* el texto sobre `primary` (cian) va en navy; para texto cian sobre blanco se usa `primary-text`.

**Criterios de aceptación**
- **Dado** un componente, **cuando** usa `bg-primary`, `text-ink-muted` o `rounded-lg`, **entonces** obtiene los valores del sistema de diseño.
- **Dado** el código, **cuando** se buscan colores en hexadecimal fuera del archivo de tema, **entonces** no hay ninguno.

---

### HU-09 · Componentes ui reutilizables

**Historia:** Como **equipo de frontend**, quiero una librería de componentes base, para armar pantallas rápido y con el mismo estilo.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 11–12 oct | `feature/frontend-base` | Obligatoria | 5 | HU-08 |

**Casos de uso**
- *Principal:* en `components/ui/` se crean:
  - `Button` (primario, secundario, peligro, fantasma; con estado de carga).
  - `Input`, `Select` y `Textarea`, con etiqueta, ayuda y error.
  - `Card`, `Badge` y `StatusBadge` (los 10 estados con su color).
  - `Plate` (placa amarilla), `AppBar`, `BottomSheet` (en escritorio se ve como diálogo), `Tabs`.
  - `EmptyState`, `Skeleton` y `Toast`.
- *Alterno, el componente necesita lógica de negocio:* no va en `ui`; va en `features/<f>/components`.

**Criterios de aceptación**
- **Dado** cualquier botón o campo, **cuando** se mide, **entonces** su zona de toque es de al menos 48 px.
- **Dado** un `Input` con error, **cuando** se muestra, **entonces** el mensaje se lee debajo y el campo tiene `aria-invalid`.
- **Dado** un `BottomSheet` abierto, **cuando** se presiona Escape o se toca el fondo, **entonces** se cierra y el foco vuelve al botón que lo abrió.
- **Dado** `StatusBadge`, **cuando** recibe cualquiera de los 10 estados, **entonces** muestra el texto en español y el color correcto.
- **Dado** los componentes, **cuando** se corren las pruebas, **entonces** al menos `Button`, `Input` y `StatusBadge` tienen prueba con Testing Library.

---

### HU-10 · Layouts y navegación por rol

**Historia:** Como **usuario de cualquier rol**, quiero una navegación cómoda en el celular y en el computador, con solo las opciones de mi rol, para moverme sin perderme.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 12–13 oct | `feature/frontend-base` | Obligatoria | 3 | HU-09 |

**Casos de uso**
- *Principal:*
  - `AuthLayout` para las pantallas sin sesión.
  - `AppLayout` con barra inferior en celular (menos de 1024 px) y menú lateral de 240 px en computador.
  - Las opciones dependen del rol:
    - **Admin:** Inicio, Órdenes, Clientes, Equipo, Perfil.
    - **Mecánico:** Órdenes asignadas, Perfil.
    - **Cliente:** Mis motos, Mis órdenes, Perfil.
- *Alterno, mecánico:* nunca ve «Clientes» ni la opción de crearlos, como se definió en el prototipo.

**Criterios de aceptación**
- **Dado** un ancho de 390 px, **cuando** se abre la app con sesión, **entonces** se ve la barra inferior y no hay desplazamiento horizontal.
- **Dado** un ancho de 1280 px, **cuando** se abre la app, **entonces** se ve el menú lateral con el botón «Cerrar sesión» visible.
- **Dado** un mecánico, **cuando** mira la navegación, **entonces** no aparece «Clientes».
- **Dado** la opción de la página actual, **cuando** se muestra, **entonces** queda resaltada y tiene `aria-current="page"`.

---

### HU-11 · Rutas, carga diferida y página 404

**Historia:** Como **usuario**, quiero que la app cargue rápido y que una dirección equivocada me muestre una página clara, para no ver pantallas en blanco.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 12 oct | `feature/frontend-base` | Obligatoria | 2 | HU-10 |

**Casos de uso**
- *Principal:*
  1. Se configura React Router en `router/` con las páginas cargadas con `lazy`.
  2. Hay un indicador de carga mientras llega cada página.
  3. Se definen rutas por rol: `/admin/*`, `/mecanico/*` y `/cliente/*`.
- *Alterno, ruta inexistente:* se muestra la página 404 con un botón «Volver al inicio».
- *Alterno, error al cargar una página:* se muestra un mensaje con el botón «Reintentar».

**Criterios de aceptación**
- **Dado** la dirección `/no-existe`, **cuando** se abre, **entonces** se ve la página 404.
- **Dado** el build, **cuando** se revisan los archivos generados, **entonces** cada página está en su propio archivo.
- **Dado** la app publicada, **cuando** se recarga una ruta interna como `/admin/ordenes`, **entonces** carga bien y no da 404 del servidor.

---

### HU-12 · Cliente HTTP y manejo de errores

**Historia:** Como **equipo de frontend**, quiero un cliente Axios con TanStack Query ya configurado, para pedir datos sin repetir código y mostrar errores siempre igual.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 13 oct | `feature/frontend-base` | Obligatoria | 2 | HU-03 |

**Casos de uso**
- *Principal:*
  1. `lib/http.ts` crea Axios con `baseURL = VITE_API_URL`, `withCredentials: true` y el token de acceso en la cabecera.
  2. `lib/queryClient.ts` configura TanStack Query.
  3. Se crea una utilidad que convierte `{ message, errors }` del backend en mensajes por campo.
- *Alterno A, error 400 con errores por campo:* cada mensaje aparece en su campo del formulario.
- *Alterno B, error 500 o sin conexión:* se muestra un aviso general «No pudimos conectar. Intenta de nuevo.».

**Criterios de aceptación**
- **Dado** una respuesta 400 con `errors: [{ field: "placa", message: "Ya existe" }]`, **cuando** se envía el formulario, **entonces** «Ya existe» aparece bajo el campo placa.
- **Dado** el servidor apagado, **cuando** se hace una petición, **entonces** se muestra el aviso general y la app no se rompe.

---

## E3 · Autenticación en backend

### HU-13 · Registrar un taller con su administrador

**Historia:** Como **dueño de un taller**, quiero crear la cuenta de mi taller y mi usuario administrador en un solo paso, para empezar a usar MotoTrack.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 12 oct | `feature/auth-sesion` | Obligatoria | 3 | HU-06 |

**Endpoint:** `POST /api/auth/register-taller`

**Casos de uso**
- *Principal:*
  1. El dueño envía los datos del taller (nombre, NIT opcional, teléfono, dirección) y los suyos (nombre, correo, contraseña).
  2. El sistema valida, crea el taller y el usuario `admin` en una sola transacción, y cifra la contraseña con bcrypt (costo 12).
  3. Devuelve el token de acceso en el cuerpo y deja la cookie de renovación.
- *Alterno A, correo ya registrado:* responde 409 «Este correo ya está registrado».
- *Alterno B, datos inválidos:* responde 400 con los errores por campo.
- *Alterno C, falla a mitad del proceso:* la transacción se deshace y no queda un taller sin admin.

**Criterios de aceptación**
- **Dado** datos válidos, **cuando** se registra, **entonces** responde 201 con `{ data: { accessToken, usuario } }` y la cookie `refreshToken` es httpOnly, SameSite=Strict, ruta `/api/auth` y Secure en producción.
- **Dado** una contraseña de menos de 8 caracteres o sin números, **cuando** se envía, **entonces** responde 400 con el error en `password`.
- **Dado** el registro exitoso, **cuando** se mira la base, **entonces** la contraseña está cifrada y nunca aparece en ninguna respuesta.
- **Dado** un correo existente, **cuando** se intenta registrar, **entonces** responde 409 y no se crea el taller.

---

### HU-14 · Registrarme como cliente

**Historia:** Como **cliente de un taller**, quiero crear mi cuenta con correo y contraseña, para consultar el estado de mis motos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 12 oct | `feature/auth-sesion` | Obligatoria | 2 | HU-13 |

**Endpoint:** `POST /api/auth/register`

**Casos de uso**
- *Principal:*
  1. El cliente elige su taller, escribe nombre, documento, teléfono, correo y contraseña.
  2. Se crean `Usuario` (rol `cliente`) y `Cliente` en una transacción y se inicia la sesión.
- *Alterno A, el taller ya lo registró antes (HU-24):* si el documento o el correo coincide con un cliente sin usuario en ese taller, se vincula la cuenta a ese cliente en vez de duplicarlo, y ve sus motos y órdenes de inmediato.
- *Alterno B, correo ya usado:* responde 409.
- *Alterno C, taller inexistente:* responde 404.

**Criterios de aceptación**
- **Dado** datos válidos, **cuando** se registra, **entonces** responde 201, el rol es siempre `cliente` y queda con sesión.
- **Dado** un cuerpo que trae `rol: "admin"`, **cuando** se registra, **entonces** el campo se ignora y el rol queda `cliente`.
- **Dado** un cliente creado antes por el admin con el mismo documento, **cuando** se registra, **entonces** no se duplica y ve sus motos ya registradas.
- **Dado** un usuario nuevo sin motos, **cuando** entra, **entonces** no ve ninguna moto de ejemplo (corrige el error visto en el prototipo).

---

### HU-15 · Iniciar sesión

**Historia:** Como **usuario registrado**, quiero entrar con mi correo y contraseña, para usar la app según mi rol.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 12 oct | `feature/auth-sesion` | Obligatoria | 2 | HU-13 |

**Endpoint:** `POST /api/auth/login`

**Casos de uso**
- *Principal:*
  1. El usuario envía correo y contraseña.
  2. El sistema compara con bcrypt.
  3. Emite un token de acceso de 15 minutos con `{ usuarioId, rol, tallerId }` y una cookie de renovación de 7 días, cuyo hash se guarda en `RefreshToken`.
- *Alterno A, correo o contraseña incorrectos:* responde 401 «Correo o contraseña incorrectos», el mismo mensaje en ambos casos.
- *Alterno B, usuario inactivo:* responde 403 «Tu cuenta está desactivada. Habla con tu taller.».

**Criterios de aceptación**
- **Dado** credenciales válidas, **cuando** inicia sesión, **entonces** responde 200 con `accessToken` y `usuario` (sin contraseña) y deja la cookie.
- **Dado** una contraseña mala, **cuando** inicia sesión, **entonces** responde 401 con el mensaje genérico.
- **Dado** el token de acceso, **cuando** se decodifica, **entonces** expira en 15 minutos y contiene `usuarioId`, `rol` y `tallerId`.
- **Dado** el inicio de sesión, **cuando** se mira la tabla `RefreshToken`, **entonces** se guardó el hash y no el token en claro.

---

### HU-16 · Mantener la sesión abierta (renovación)

**Historia:** Como **usuario**, quiero que mi sesión siga activa mientras uso la app, para no volver a escribir la contraseña cada 15 minutos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 13 oct | `feature/auth-sesion` | Obligatoria | 3 | HU-15 |

**Endpoint:** `POST /api/auth/refresh`

**Casos de uso**
- *Principal:*
  1. El navegador envía la cookie.
  2. El sistema la verifica, busca su hash, lo invalida y emite un token de acceso nuevo y una cookie nueva (rotación).
- *Alterno A, cookie vencida o inexistente:* responde 401 y el frontend lleva al inicio de sesión.
- *Alterno B, cookie ya usada (posible robo):* se invalidan todas las sesiones de ese usuario y responde 401.

**Criterios de aceptación**
- **Dado** una cookie válida, **cuando** se llama a `/refresh`, **entonces** responde 200 con un `accessToken` nuevo y una cookie distinta a la anterior.
- **Dado** una cookie que ya se usó, **cuando** se vuelve a usar, **entonces** responde 401 y todas las sesiones del usuario quedan cerradas.
- **Dado** una cookie de más de 7 días, **cuando** se usa, **entonces** responde 401.
- **Dado** las pruebas con Supertest, **cuando** se corren, **entonces** cubren los tres casos anteriores.

---

### HU-17 · Cerrar sesión

**Historia:** Como **usuario**, quiero cerrar sesión, para que nadie use mi cuenta en un equipo compartido del taller.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 13 oct | `feature/auth-sesion` | Obligatoria | 1 | HU-16 |

**Endpoint:** `POST /api/auth/logout`

**Casos de uso**
- *Principal:* el sistema invalida el token de renovación actual y borra la cookie.
- *Alterno, sin cookie:* responde 204 igual; cerrar sesión nunca falla.

**Criterios de aceptación**
- **Dado** una sesión activa, **cuando** se cierra, **entonces** responde 204, la cookie queda vacía y vencida, y ese token ya no sirve en `/refresh`.

---

### HU-18 · Ver mi perfil y proteger por rol

**Historia:** Como **equipo**, quiero un middleware que verifique el token, el rol y el taller en cada ruta, para que nadie vea ni cambie datos que no le corresponden.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 2 | 13 oct | `feature/auth-sesion` | Obligatoria | 2 | HU-15 |

**Endpoint:** `GET /api/auth/me` y middlewares `requireAuth` y `requireRole(...)`.

**Casos de uso**
- *Principal:*
  1. `requireAuth` lee el Bearer, lo verifica y deja `req.user = { usuarioId, rol, tallerId }`.
  2. `requireRole('admin')` deja pasar solo ese rol.
  3. Los servicios filtran siempre por `req.user.tallerId`.
- *Alterno A, sin token o token vencido:* responde 401.
- *Alterno B, rol no permitido:* responde 403.
- *Alterno C, recurso de otro taller:* responde 404, como si no existiera, para no revelar datos.

**Criterios de aceptación**
- **Dado** un token válido, **cuando** se pide `/api/auth/me`, **entonces** responde con el usuario y su taller, sin contraseña.
- **Dado** un mecánico, **cuando** pide `POST /api/clientes`, **entonces** responde 403.
- **Dado** un admin del taller A, **cuando** pide una orden del taller B por su ID, **entonces** responde 404.
- **Dado** las pruebas, **cuando** se corren, **entonces** existe al menos una prueba por cada caso: 401, 403 y 404 entre talleres.

---

## E4 · Autenticación en frontend

### HU-19 · Pantalla de inicio de sesión

**Historia:** Como **usuario**, quiero una pantalla de ingreso clara y cómoda en el celular, para entrar rápido a mi cuenta.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 3 | 14 oct | `feature/auth-frontend` | Obligatoria | 2 | HU-09, HU-12, HU-15 |

**Casos de uso**
- *Principal:*
  1. El usuario escribe correo y contraseña (con botón para mostrarla) y presiona «Ingresar».
  2. Ve el botón en estado de carga.
  3. Llega al inicio de su rol.
- *Alterno A, datos incorrectos:* aparece «Correo o contraseña incorrectos» y los campos conservan el correo.
- *Alterno B, formulario incompleto:* se valida con Zod antes de enviar y se marca el campo.
- *Alterno C, «¿Olvidaste tu contraseña?»:* en esta entrega muestra «Pídele a tu taller que te ayude a recuperarla»; la recuperación por OTP llega en la segunda entrega.

**Criterios de aceptación**
- **Dado** un admin válido, **cuando** ingresa, **entonces** llega a `/admin`; un mecánico, a `/mecanico`; un cliente, a `/cliente`.
- **Dado** el formulario enviándose, **cuando** se presiona otra vez, **entonces** no se envía dos veces.
- **Dado** un ancho de 390 px, **cuando** se abre, **entonces** el teclado del celular muestra «@» en el correo (`type="email"`) y nada se sale de la pantalla.

---

### HU-20 · Pantallas de registro

**Historia:** Como **dueño de taller o cliente**, quiero registrarme desde la app eligiendo mi tipo de cuenta, para empezar sin depender de nadie.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 3 | 14 oct | `feature/auth-frontend` | Obligatoria | 3 | HU-13, HU-14, HU-19 |

**Casos de uso**
- *Principal, taller:* elige «Tengo un taller», llena los datos del taller y luego los suyos (dos pasos con indicador de progreso) y llega a `/admin`.
- *Principal, cliente:* elige «Soy cliente», selecciona su taller de una lista, llena sus datos y llega a `/cliente`.
- *Alterno A, correo existente:* error en el campo correo y enlace «¿Ya tienes cuenta? Ingresa».
- *Alterno B, volver al paso anterior:* los datos ya escritos se conservan.

**Criterios de aceptación**
- **Dado** el paso 2 del registro de taller, **cuando** se presiona «Atrás», **entonces** el paso 1 conserva lo escrito.
- **Dado** contraseñas que no coinciden, **cuando** se envía, **entonces** se marca el campo de confirmación.
- **Dado** un registro exitoso, **cuando** termina, **entonces** el usuario queda con sesión sin volver a ingresar.
- **Dado** la pantalla de registro, **cuando** se revisa, **entonces** no existe la opción de registrarse como mecánico; a los mecánicos los crea el admin (HU-23).

---

### HU-21 · Sesión que sobrevive a recargar la página

**Historia:** Como **usuario**, quiero seguir con sesión al recargar o volver a la app, para no ingresar a cada rato.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 3 | 14 oct | `feature/auth-frontend` | Obligatoria | 2 | HU-16, HU-12 |

**Casos de uso**
- *Principal:*
  1. Al abrir la app, `features/auth` llama a `/refresh`.
  2. Si responde bien, guarda el token en Zustand (solo en memoria) y pide `/me`.
  3. Mientras tanto se ve una pantalla de carga.
- *Alterno A, token vencido durante el uso:* el interceptor de Axios recibe 401, llama a `/refresh` una sola vez (aunque haya varias peticiones a la vez) y repite la petición original.
- *Alterno B, renovación fallida:* se limpia la sesión y se lleva al ingreso con el aviso «Tu sesión terminó».

**Criterios de aceptación**
- **Dado** una sesión activa, **cuando** se recarga la página, **entonces** el usuario sigue dentro, en la misma ruta.
- **Dado** el navegador, **cuando** se revisan `localStorage` y `sessionStorage`, **entonces** no hay ningún token.
- **Dado** 3 peticiones que reciben 401 al mismo tiempo, **cuando** se renueva, **entonces** se hace una sola llamada a `/refresh` y las 3 se repiten bien.

---

### HU-22 · Acceso según mi rol y botón de salir

**Historia:** Como **usuario**, quiero ver solo lo que me corresponde y poder salir desde cualquier pantalla, para trabajar seguro.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 3 | 14 oct | `feature/auth-frontend` | Obligatoria | 2 | HU-11, HU-21, HU-17 |

**Casos de uso**
- *Principal:* el router usa `<RequireAuth>` y `<RequireRole roles={[...]}>`; «Cerrar sesión» está en el perfil (celular) y en el menú lateral (computador).
- *Alterno A, sin sesión:* al abrir una ruta privada, se lleva al ingreso y, al entrar, se vuelve a la ruta pedida.
- *Alterno B, rol equivocado:* un cliente que escribe `/admin` va a su propio inicio.

**Criterios de aceptación**
- **Dado** un usuario sin sesión, **cuando** abre `/admin/ordenes`, **entonces** va a `/login` y después de ingresar vuelve a `/admin/ordenes`.
- **Dado** un cliente, **cuando** abre `/admin`, **entonces** termina en `/cliente`.
- **Dado** cualquier rol en 1280 px, **cuando** busca «Cerrar sesión», **entonces** lo ve en el menú lateral sin abrir nada más.
- **Dado** que cerró sesión, **cuando** presiona «Atrás» en el navegador, **entonces** no ve datos privados.

---

## E5 · Usuarios, clientes y motos

### HU-23 · Crear cuentas de mecánico

**Historia:** Como **admin**, quiero crear la cuenta de cada mecánico de mi taller, para asignarles órdenes.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 4 | 14 oct | `feature/clientes-motos` | Obligatoria | 2 | HU-18 |

**Endpoints:** `POST /api/usuarios`, `GET /api/usuarios?rol=mecanico`, `PATCH /api/usuarios/:id` (activar o desactivar).

**Casos de uso**
- *Principal:*
  1. En «Equipo», el admin presiona «Agregar mecánico».
  2. Escribe nombre, correo y una contraseña temporal.
  3. El mecánico la usa para su primer ingreso.
- *Alterno A, mecánico que se va:* el admin lo desactiva; no puede ingresar, pero su historial se conserva.
- *Alterno B, correo existente:* 409.

> La invitación por enlace u OTP del prototipo queda para la segunda entrega, porque necesita envío de correo o WhatsApp.

**Criterios de aceptación**
- **Dado** un admin, **cuando** crea un mecánico, **entonces** queda con rol `mecanico` y el `tallerId` del admin, sin importar lo que se envíe.
- **Dado** un mecánico desactivado, **cuando** intenta ingresar, **entonces** recibe 403.
- **Dado** un mecánico o un cliente, **cuando** llama a `POST /api/usuarios`, **entonces** recibe 403.

---

### HU-24 · Registrar un cliente en el taller

**Historia:** Como **admin**, quiero registrar a un cliente que llega al taller, para abrirle una orden aunque no tenga cuenta en la app.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 4 | 14 oct | `feature/clientes-motos` | Obligatoria | 2 | HU-18 |

**Endpoint:** `POST /api/clientes`

**Casos de uso**
- *Principal:* el admin abre «Nuevo cliente», escribe nombre, documento, teléfono y correo (opcional) y guarda; el cliente aparece en la lista.
- *Alterno A, documento repetido en el taller:* 409 «Ya existe un cliente con este documento», con enlace para verlo.
- *Alterno B, se registra después en la app:* se vincula según HU-14, alterno A.

**Criterios de aceptación**
- **Dado** datos válidos, **cuando** guarda, **entonces** responde 201 y el cliente queda en el taller del admin.
- **Dado** un teléfono con letras o con menos de 10 dígitos, **cuando** guarda, **entonces** se marca el error en front y back.
- **Dado** un mecánico, **cuando** intenta crear un cliente, **entonces** recibe 403 y en su interfaz no existe el botón.

---

### HU-25 · Buscar y ver clientes

**Historia:** Como **admin**, quiero buscar clientes por nombre, documento, teléfono o placa, para encontrarlos rápido en el mostrador.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 4 | 15 oct | `feature/clientes-motos` | Obligatoria | 2 | HU-24 |

**Endpoints:** `GET /api/clientes?q=&page=&limit=`, `GET /api/clientes/:id`, `PATCH /api/clientes/:id`.

**Casos de uso**
- *Principal:*
  1. El admin escribe en el buscador y la lista se filtra (con una pausa de unos 300 ms tras dejar de escribir).
  2. Al tocar un cliente ve sus datos, sus motos y sus órdenes.
- *Alterno A, sin resultados:* estado vacío con el botón «Registrar cliente».
- *Alterno B, editar:* el admin corrige teléfono o correo.

**Criterios de aceptación**
- **Dado** la placa «ABC12D», **cuando** se busca «abc12», **entonces** aparece su dueño.
- **Dado** más de 20 clientes, **cuando** se listan, **entonces** la respuesta trae `meta: { page, limit, total }` y la pantalla permite ver más.
- **Dado** la lista cargando, **cuando** aún no llegan datos, **entonces** se ven esqueletos de carga y no una pantalla en blanco.

---

### HU-26 · Registrar una moto

**Historia:** Como **admin**, quiero registrar una o varias motos de un cliente, para asociarles órdenes de servicio. Como **cliente**, quiero agregar mis motos, para tenerlas listas en el taller.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 4 | 15 oct | `feature/clientes-motos` | Obligatoria | 3 | HU-24 |

**Endpoints:** `POST /api/motos`, `GET /api/motos?clienteId=`, `PATCH /api/motos/:id`.

**Casos de uso**
- *Principal, admin:* desde el detalle del cliente presiona «Agregar moto» y escribe placa, marca, modelo, año, cilindraje, color y kilometraje.
- *Principal, cliente:* desde «Mis motos» presiona «Agregar moto»; queda a su nombre automáticamente.
- *Alterno A, placa repetida en el taller:* 409 «Esta placa ya está registrada».
- *Alterno B, al crear una orden:* el admin puede agregar una moto nueva al cliente sin salir del formulario de la orden (corrige lo visto en el prototipo).

**Criterios de aceptación**
- **Dado** la placa «abc 12d», **cuando** se guarda, **entonces** se normaliza a «ABC12D» y se valida el formato colombiano de moto (3 letras, 2 números y 1 letra) o el de moto antigua (3 letras y 2 números).
- **Dado** un año mayor al próximo año, **cuando** se guarda, **entonces** se marca el error.
- **Dado** un cliente, **cuando** crea una moto, **entonces** queda con su propio `clienteId`, aunque intente enviar otro.
- **Dado** una moto guardada, **cuando** se muestra, **entonces** la placa usa el componente `Plate`.

---

### HU-27 · Ver mis motos como cliente

**Historia:** Como **cliente**, quiero ver mis motos y su estado actual en el taller, para saber cuál está en reparación.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 4 | 15 oct | `feature/clientes-motos` | Obligatoria | 1 | HU-26 |

**Endpoint:** `GET /api/motos` (para el cliente, el backend filtra por su `clienteId`).

**Casos de uso**
- *Principal:* el cliente ve tarjetas con placa, marca y modelo y, si tiene una orden abierta, su estado.
- *Alterno, sin motos:* estado vacío «Aún no tienes motos registradas» con el botón «Agregar moto».

**Criterios de aceptación**
- **Dado** un cliente con 2 motos, **cuando** abre «Mis motos», **entonces** ve solo esas 2.
- **Dado** un cliente nuevo, **cuando** abre «Mis motos», **entonces** ve el estado vacío, no motos de otros.

---

## E6 · Órdenes de servicio

### HU-28 · Motor de estados e historial (backend)

**Historia:** Como **equipo**, quiero que el cambio de estado de una orden pase siempre por una sola función que valide la transición y guarde el historial, para que ninguna orden quede en un estado imposible.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 15 oct | `feature/ordenes` | Obligatoria | 3 | HU-06, HU-18 |

**Endpoint:** `PATCH /api/ordenes/:id/estado` con `{ estado, observacion? }`.

**Casos de uso**
- *Principal:*
  1. `estados.ts` define las transiciones permitidas y qué rol puede hacer cada una.
  2. `cambiarEstado()` valida, actualiza la orden y crea un registro en `HistorialOrden` en la misma transacción.
- *Alterno A, transición inválida (por ejemplo de `registrada` a `entregada`):* 409 «No se puede pasar de Registrada a Entregada».
- *Alterno B, rol sin permiso para esa transición:* 403.
- *Alterno C, cancelar sin motivo:* 400 con error en `observacion`.

**Transiciones y quién las hace**

| De → A | Rol |
|---|---|
| registrada → diagnosticada | mecánico asignado (lo hace HU-32 al guardar el diagnóstico) |
| diagnosticada → esperando_aprobacion | admin o mecánico asignado |
| esperando_aprobacion → aprobada / cancelada | cliente dueño o admin |
| aprobada → en_reparacion | mecánico asignado |
| en_reparacion → pendiente_repuesto / lista_entrega | mecánico asignado |
| pendiente_repuesto → en_reparacion | mecánico asignado |
| lista_entrega → entregada | admin |
| entregada → cerrada | admin |
| cualquier estado abierto → cancelada (con motivo) | admin |

**Criterios de aceptación**
- **Dado** cada una de las transiciones de la tabla, **cuando** se prueban con Vitest, **entonces** las permitidas pasan y todas las demás devuelven 409.
- **Dado** un cambio exitoso, **cuando** se mira `HistorialOrden`, **entonces** hay un registro con estado anterior, estado nuevo, usuario, fecha y observación.
- **Dado** una orden `cerrada` o `cancelada`, **cuando** se intenta cambiar, **entonces** responde 409.
- **Dado** un mecánico no asignado a la orden, **cuando** intenta moverla, **entonces** responde 403.
- **Dado** `frontend/src/features/ordenes/estados.ts`, **cuando** se compara con el del backend, **entonces** tiene las mismas transiciones y los textos en español.

---

### HU-29 · Crear una orden de servicio

**Historia:** Como **admin**, quiero abrir una orden cuando llega una moto, asignando un mecánico y anotando lo que reporta el cliente, para empezar el trabajo con todo registrado.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 15 oct | `feature/ordenes` | Obligatoria | 3 | HU-26, HU-23, HU-28 |

**Endpoint:** `POST /api/ordenes`

**Casos de uso**
- *Principal:*
  1. El admin busca al cliente, elige la moto, escribe el motivo de ingreso y el kilometraje, y asigna un mecánico activo.
  2. Al guardar, la orden queda `registrada`, con número consecutivo del taller y su primer registro en el historial.
- *Alterno A, cliente nuevo:* desde el mismo formulario registra cliente y moto sin perder lo escrito.
- *Alterno B, la moto ya tiene una orden abierta:* aviso «Esta moto ya tiene la orden #N abierta», con enlace a esa orden; no se crea otra.
- *Alterno C, sin mecánicos activos:* aviso con enlace a «Equipo» para crear uno.

**Criterios de aceptación**
- **Dado** datos válidos, **cuando** se crea, **entonces** responde 201, el estado es `registrada` y existe su primer registro en el historial.
- **Dado** una moto con una orden abierta, **cuando** se intenta crear otra, **entonces** responde 409.
- **Dado** un kilometraje menor al último registrado de la moto, **cuando** se guarda, **entonces** se marca el error.
- **Dado** un mecánico de otro taller, **cuando** se asigna, **entonces** responde 400.

---

### HU-30 · Ver la lista de órdenes

**Historia:** Como **admin**, quiero ver todas las órdenes del taller filtradas por estado; como **mecánico**, las que tengo asignadas; y como **cliente**, las de mis motos, para saber en qué va cada una.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 15 oct | `feature/ordenes` | Obligatoria | 2 | HU-29 |

**Endpoint:** `GET /api/ordenes?estado=&q=&page=&limit=` (el backend filtra según el rol).

**Casos de uso**
- *Principal:*
  1. El usuario ve tarjetas con número, placa, moto, cliente, mecánico, estado y fecha.
  2. Puede filtrar con pestañas: Todas, En proceso, Por aprobar, Listas, Cerradas.
- *Alterno A, sin órdenes:* estado vacío según el rol.
- *Alterno B, búsqueda por placa o número:* filtra la lista.

**Criterios de aceptación**
- **Dado** un mecánico, **cuando** abre la lista, **entonces** solo ve órdenes donde él es el asignado.
- **Dado** un cliente, **cuando** abre la lista, **entonces** solo ve órdenes de sus motos.
- **Dado** el filtro «Por aprobar», **cuando** se aplica, **entonces** solo aparecen órdenes `esperando_aprobacion`.
- **Dado** un ancho de 390 px, **cuando** se ve la lista, **entonces** cada tarjeta muestra la placa y el estado sin cortarse.

---

### HU-31 · Ver el detalle y el historial de una orden

**Historia:** Como **usuario con acceso a una orden**, quiero ver toda su información y la línea de tiempo de estados, para entender qué ha pasado y qué sigue.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 2 | HU-30 |

**Endpoint:** `GET /api/ordenes/:id` (incluye moto, cliente, mecánico, diagnóstico, servicios e historial).

**Casos de uso**
- *Principal:*
  1. El usuario ve los datos de la orden, el diagnóstico, los servicios con su total y la línea de tiempo de estados (quién, cuándo y observación).
  2. Abajo aparecen solo los botones de las acciones que su rol puede hacer en el estado actual.
- *Alterno, orden ajena:* 404 y pantalla «No encontramos esta orden».

**Criterios de aceptación**
- **Dado** una orden `en_reparacion` vista por su mecánico, **cuando** se muestra, **entonces** solo aparecen «Falta repuesto» y «Lista para entregar».
- **Dado** la misma orden vista por el cliente, **cuando** se muestra, **entonces** no aparece ningún botón de cambio de estado.
- **Dado** el historial, **cuando** se muestra, **entonces** va del más reciente al más antiguo, con fecha y hora en la zona de Colombia.
- **Dado** valores de dinero, **cuando** se muestran, **entonces** salen como «$ 85.000».

---

### HU-32 · Registrar el diagnóstico

**Historia:** Como **mecánico**, quiero escribir el diagnóstico de la moto asignada, para que el taller y el cliente sepan qué tiene y qué se recomienda.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 2 | HU-28, HU-31 |

**Endpoint:** `POST /api/ordenes/:id/diagnostico`

**Casos de uso**
- *Principal:*
  1. En una orden `registrada`, el mecánico presiona «Diagnosticar».
  2. Escribe hallazgos, trabajo recomendado y prioridad (normal o urgente).
  3. Al guardar, la orden pasa a `diagnosticada`.
- *Alterno A, corregir el diagnóstico:* mientras la orden siga `diagnosticada`, puede editarlo.
- *Alterno B, enviar al cliente:* desde ahí mismo presiona «Enviar para aprobación» y la orden pasa a `esperando_aprobacion`.

**Criterios de aceptación**
- **Dado** una orden `registrada` del mecánico, **cuando** guarda un diagnóstico válido, **entonces** la orden queda `diagnosticada` y el historial lo registra.
- **Dado** hallazgos de menos de 10 caracteres, **cuando** guarda, **entonces** se marca el error.
- **Dado** una orden `aprobada`, **cuando** se intenta editar el diagnóstico, **entonces** responde 409.

---

### HU-33 · Agregar servicios y calcular el costo *(deseable)*

**Historia:** Como **admin o mecánico**, quiero agregar servicios del catálogo a la orden, para que el cliente vea cuánto cuesta antes de aprobar.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Deseable | 3 | HU-32, HU-07 |

**Endpoints:** `GET /api/servicios`, `POST /api/ordenes/:id/servicios`, `DELETE /api/ordenes/:id/servicios/:detalleId`.

**Casos de uso**
- *Principal:*
  1. El usuario elige un servicio del catálogo (cargado por el seed), ajusta la cantidad y, si hace falta, el precio.
  2. El total de la orden se recalcula en el backend.
- *Alterno A, quitar un servicio:* el total baja.
- *Alterno B, orden ya aprobada:* no se pueden cambiar servicios (409); habría que cancelar y abrir otra (los adicionales quedan para la segunda entrega).

**Criterios de aceptación**
- **Dado** 2 servicios de $ 40.000 y $ 25.000, **cuando** se agregan, **entonces** `costoTotal` es 65000 y lo calcula el backend, no el navegador.
- **Dado** un precio negativo o con decimales, **cuando** se guarda, **entonces** responde 400.
- **Dado** una orden `esperando_aprobacion` o posterior, **cuando** se intenta agregar un servicio, **entonces** responde 409.

> Si al 14 de octubre auth no está lista, esta historia pasa a la segunda entrega (CONTEXTO.md, sección 14).

---

### HU-34 · Aprobar o rechazar el diagnóstico

**Historia:** Como **cliente**, quiero aprobar o rechazar el diagnóstico y el costo desde la app, para decidir si reparan mi moto. Como **admin**, quiero registrar la decisión cuando el cliente la da por teléfono.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 2 | HU-28, HU-32 |

**Casos de uso**
- *Principal, aprobar:* el cliente abre la orden `esperando_aprobacion`, lee el diagnóstico y el total, presiona «Aprobar» y confirma; la orden pasa a `aprobada`.
- *Alterno A, rechazar:* presiona «Rechazar», elige o escribe un motivo y confirma; la orden pasa a `cancelada` y ve el mensaje «Puedes recoger tu moto en el taller».
- *Alterno B, por teléfono:* el admin hace lo mismo y el historial guarda «Registrado por [admin]: aprobado por teléfono».

**Criterios de aceptación**
- **Dado** el dueño de la moto, **cuando** aprueba, **entonces** la orden queda `aprobada` y el historial lo registra con su usuario.
- **Dado** otro cliente, **cuando** intenta aprobar, **entonces** recibe 404.
- **Dado** el botón «Rechazar», **cuando** se confirma sin motivo, **entonces** no se permite.
- **Dado** la confirmación, **cuando** se muestra, **entonces** aparece en un `BottomSheet` con el total, para evitar aprobaciones por error.

---

### HU-35 · Avanzar la reparación

**Historia:** Como **mecánico**, quiero marcar cuándo empiezo, cuándo me falta un repuesto y cuándo termino, para que el taller y el cliente sepan en qué va la moto.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 2 | HU-28, HU-31 |

**Casos de uso**
- *Principal:* en `aprobada` presiona «Iniciar reparación» (pasa a `en_reparacion`), y al terminar presiona «Lista para entregar» (pasa a `lista_entrega`).
- *Alterno A, falta un repuesto:* presiona «Falta repuesto» y escribe cuál (pasa a `pendiente_repuesto`); cuando llega, presiona «Reanudar» (vuelve a `en_reparacion`).
- *Alterno B, sin conexión al presionar:* se muestra el error y el estado en pantalla no cambia hasta que el servidor confirme.

**Criterios de aceptación**
- **Dado** una orden `en_reparacion`, **cuando** el mecánico marca «Falta repuesto» sin escribir cuál, **entonces** no se permite.
- **Dado** el cambio a `lista_entrega`, **cuando** el cliente abre la orden, **entonces** ve «Tu moto está lista. Puedes recogerla.».
- **Dado** cualquier cambio, **cuando** termina, **entonces** la lista y el detalle se actualizan sin recargar la página.

---

### HU-36 · Entregar y cerrar la orden

**Historia:** Como **admin**, quiero registrar la entrega de la moto y luego cerrar la orden, para dejar el trabajo terminado en el sistema.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 1 | HU-35 |

**Casos de uso**
- *Principal:* en `lista_entrega` presiona «Entregar moto» (pasa a `entregada`) y luego «Cerrar orden» (pasa a `cerrada`).
- *Alterno, intentar cerrar antes de entregar:* el botón no aparece y la API responde 409.

**Criterios de aceptación**
- **Dado** una orden `lista_entrega`, **cuando** se intenta cerrar directamente, **entonces** responde 409; solo una orden `entregada` puede cerrarse.
- **Dado** una orden `cerrada`, **cuando** se abre, **entonces** se ve en modo de solo lectura.

---

### HU-37 · Cancelar una orden con motivo

**Historia:** Como **admin**, quiero cancelar una orden abierta dejando el motivo, para que quede claro por qué no se terminó.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 5 | 16 oct | `feature/ordenes` | Obligatoria | 1 | HU-28 |

**Casos de uso**
- *Principal:* desde el detalle presiona «Cancelar orden», escribe el motivo y confirma; la orden pasa a `cancelada`.
- *Alterno, orden ya entregada o cerrada:* no se puede cancelar (409).

**Criterios de aceptación**
- **Dado** una orden abierta, **cuando** se cancela con motivo, **entonces** el historial guarda el motivo como observación.
- **Dado** una orden `entregada`, **cuando** se intenta cancelar, **entonces** responde 409.
- **Dado** el botón «Cancelar orden», **cuando** se muestra, **entonces** usa el estilo de peligro y pide confirmación.

---

## E6.5 · Migración al diseño nuevo

Se hace **antes de E7**, para que la versión desplegada ya tenga el diseño nuevo.

**Alcance:** solo cambia cómo se ven las pantallas que ya existen (E2 a E6). No se agregan reglas del negocio, rutas de la API, tablas ni pantallas nuevas. Las funciones que el prototipo muestra y el repositorio todavía no tiene (citas, inventario, IA, suscripción, landing, notificaciones, modo oscuro) quedan para sus propias HU.

**Referencia:** `docs/diseno.md` y el prototipo (`docs/prototipo/mototrack-prototipo.html`, https://claude.ai/artifact/M2oVJGvZ6oAqGJKattY41w).

**Criterios comunes a todas las historias de esta etapa.** Además de los propios, cada una cumple:
- **Dado** cada pantalla tocada, **cuando** se compara con su pantalla del prototipo en 390 px y 1440 px, **entonces** coinciden colores, fuentes, forma de los componentes y orden del contenido.
- **Dado** el código, **cuando** se corre `npm run check:tokens`, **entonces** pasa y no hay colores fuera de `index.css`.
- **Dado** 360, 390 y 1440 px, **cuando** se recorre la pantalla, **entonces** no hay desplazamiento horizontal y los toques miden al menos 48 px.
- **Dado** «reducir movimiento» activo en el sistema, **cuando** se usa la pantalla, **entonces** no hay animaciones y todo sigue funcionando.
- **Dado** el backend, **cuando** se revisa el PR, **entonces** no tiene cambios. Las pruebas que ya existían siguen pasando; solo se ajustan textos o roles de botón si el diseño los cambió.

---

### HU-41 · Colores y fuentes nuevos

**Historia:** Como **equipo de frontend**, quiero los colores y las fuentes del diseño nuevo como tokens de Tailwind, para que todas las pantallas cambien desde un solo lugar.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-base` | Obligatoria | 2 | — |

**Casos de uso**
- *Principal:*
  1. En `src/styles/index.css` se cambian los valores de los tokens por los de `docs/diseno.md` (sección 2) y se agregan `surface-sunken`, `surface-2`, `on-primary` y `danger-text`.
  2. Se quitan `brand-navy`, `primary-text`, `primary-soft`, `primary-hover`, `danger-hover` y `neutral-soft`, y se reemplazan en los componentes que los usan.
  3. Se actualiza `TOKENS_BASE` en `scripts/tokens.test.ts` con la lista nueva.
  4. Se instalan `@fontsource/geist` y `@fontsource/michroma`, y se desinstalan `@fontsource/inter` y `@fontsource/montserrat`.
  5. Se agregan `--font-num`, los radios nuevos y las curvas de animación (`ease-out`, `ease-in-out`, `drawer`).
- *Alterno, un componente queda con poco contraste:* se usa el par de texto del token (`accent-text` sobre blanco, `ink` sobre amarillo, `on-primary` sobre tinta).

**Criterios de aceptación**
- **Dado** la app, **cuando** se abre, **entonces** el fondo es blanco, el texto usa Geist y no queda nada en cian ni en naranja.
- **Dado** el código, **cuando** se buscan `brand-navy`, `primary-text`, `Inter` o `Montserrat`, **entonces** no aparecen.
- **Dado** `npm run check:tokens`, **cuando** se corre, **entonces** pasa con la lista nueva.

---

### HU-42 · Componentes base con el diseño nuevo

**Historia:** Como **equipo de frontend**, quiero los componentes de `ui` con el estilo del prototipo, para armar las pantallas sin estilos sueltos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-base` | Obligatoria | 3 | HU-41 |

**Casos de uso**
- *Principal:* se ajustan `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `StatusBadge`, `Plate`, `Tabs`, `BottomSheet`, `AppBar`, `EmptyState`, `Skeleton`, `Toaster`, `Alert` y `Logo` según `docs/diseno.md` (sección 6). Se actualiza `/dev/ui`.
- *Alterno, hover en el celular:* los efectos de *hover* solo se aplican con `(hover: hover) and (pointer: fine)`.

**Criterios de aceptación**
- **Dado** un `Button` principal, **cuando** se muestra, **entonces** es tinta con texto blanco y radio píldora, y al presionarlo se encoge a `scale(.97)`.
- **Dado** `Plate` y cualquier monto, **cuando** se muestran, **entonces** usan Michroma.
- **Dado** `StatusBadge` con cualquiera de los 10 estados, **cuando** se muestra, **entonces** el color sigue el prototipo: amarillo si espera algo (aprobación o repuesto), verde si está lista o entregada, tinta si está cerrada, rojo si está cancelada y gris en el resto.
- **Dado** `BottomSheet`, **cuando** se abre, **entonces** sube con la curva `drawer` y sigue cerrando con Escape y devolviendo el foco (HU-09).

---

### HU-43 · Botón de mantener presionado y arco de progreso

**Historia:** Como **equipo de frontend**, quiero un botón que se confirma manteniéndolo presionado y un arco que muestre el paso de la orden, para usarlos en el detalle y en el seguimiento.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-base` | Obligatoria | 2 | HU-42 |

**Casos de uso**
- *Principal:*
  - `HoldButton` en `components/ui`: se llena en 1,2 s, dice «Suelta para …» cuando está lleno y llama `onConfirm` al soltar (`docs/diseno.md`, sección 7). Variantes principal y peligro, y estado de carga.
  - `Arc` y `Dial` en `components/ui`: reciben el paso (1 a 6) y lo dibujan en SVG con los tokens.
- *Alterno, suelta antes de tiempo:* el relleno se devuelve y no se llama `onConfirm`.
- *Alterno, teclado:* mantener Enter o Espacio funciona igual.

**Criterios de aceptación**
- **Dado** un `HoldButton`, **cuando** se suelta antes de 1,2 s, **entonces** no se ejecuta la acción.
- **Dado** un `HoldButton`, **cuando** se mantiene 1,2 s y se suelta, **entonces** se ejecuta una sola vez.
- **Dado** un lector de pantalla, **cuando** llega al botón, **entonces** escucha qué hace y que hay que mantenerlo presionado.
- **Dado** las pruebas, **cuando** se corren, **entonces** `HoldButton` tiene prueba con Testing Library (usando relojes falsos de Vitest).

---

### HU-44 · Navegación nueva

**Historia:** Como **usuario de cualquier rol**, quiero la barra superior en el computador y la barra inferior en el celular del prototipo, para moverme igual en los dos.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-navegacion` | Obligatoria | 3 | HU-42 |

**Casos de uso**
- *Principal:*
  - En computador, `AppLayout` cambia el menú lateral por la barra superior: marca, pestañas del rol (`router/nav.ts`), botón principal (admin: «Recibir moto») y menú del avatar con «Perfil» y «Cerrar sesión».
  - En celular se mantiene la barra inferior con el estilo nuevo.
  - `AuthLayout` con fondo blanco y el logo nuevo.
- *Alterno, mecánico:* sigue sin ver «Clientes» (HU-10).

**Criterios de aceptación**
- **Dado** 1440 px, **cuando** se abre la app con sesión, **entonces** se ve la barra superior y «Cerrar sesión» está en el menú del avatar. *(Reemplaza el criterio del menú lateral de HU-10.)*
- **Dado** 390 px, **cuando** se abre la app con sesión, **entonces** se ve la barra inferior.
- **Dado** la opción de la página actual, **cuando** se muestra, **entonces** queda resaltada y tiene `aria-current="page"`.
- **Dado** cualquier opción que existe en el celular, **cuando** se busca en el computador, **entonces** también está (y al revés).

---

### HU-45 · Ingreso y registro con el diseño nuevo

**Historia:** Como **persona que llega a MotoTrack**, quiero que entrar y crear mi cuenta se vea como el prototipo, para que la primera impresión sea la del producto final.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-acceso` | Obligatoria | 2 | HU-44 |

**Casos de uso**
- *Principal:* se ajustan `LoginPage`, `RegistroPage`, `RegistroTallerPage` (2 pasos) y `RegistroClientePage`, con sus formularios.
- *Alterno, error de la API:* el mensaje se sigue mostrando debajo del campo (HU-19 y HU-20).

**Criterios de aceptación**
- **Dado** las cuatro pantallas, **cuando** se comparan con el prototipo, **entonces** coinciden (criterios comunes).
- **Dado** los flujos de HU-19 y HU-20, **cuando** se prueban, **entonces** funcionan igual que antes.

---

### HU-46 · Panel del taller, clientes y equipo

**Historia:** Como **admin**, quiero el panel del taller y las pantallas de clientes y equipo con el diseño nuevo, para ver de un vistazo cómo va el taller.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-admin` | Obligatoria | 3 | HU-44 |

**Casos de uso**
- *Principal:*
  - `InicioPage`: lecturas (motos adentro, esperando al cliente, sin repuesto) y una tarjeta por moto abierta con su arco, armadas con la lista de órdenes que ya da `GET /api/ordenes`.
  - `ClientesPage`, `ClienteDetallePage` y `EquipoPage` con el estilo nuevo.
  - Formularios y hojas con un ancho máximo de 760 px en computador; el botón de guardar mide lo mismo que el formulario.
- *Alterno, taller sin órdenes:* el panel muestra un estado vacío con el botón «Recibir moto».
- *Alterno, lo que el prototipo tiene y la API no:* «Equipo hoy», «Lo que pasó hoy» y la sugerencia de IA **no** se hacen ahora; necesitan datos nuevos y van en una HU futura.

**Criterios de aceptación**
- **Dado** un admin con órdenes abiertas, **cuando** abre Inicio, **entonces** ve una tarjeta por moto con su placa, estado y arco, y al tocarla va al detalle.
- **Dado** un formulario en 1440 px, **cuando** se mide el botón de guardar, **entonces** tiene el mismo ancho que los campos.
- **Dado** el backend, **cuando** se revisa el PR, **entonces** no tiene cambios.

---

### HU-47 · Lista de órdenes y recibir moto

**Historia:** Como **admin o mecánico**, quiero la lista de órdenes y el formulario para recibir una moto con el diseño nuevo.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-ordenes` | Obligatoria | 2 | HU-44 |

**Casos de uso**
- *Principal:* se ajustan `OrdenesLista`, `OrdenCard` (placa, estado y arco pequeño) y `NuevaOrdenForm` (3 pasos), con pestañas segmentadas y buscador.
- *Alterno, crear cliente o moto dentro del formulario:* sigue funcionando (HU-26 alterno B, HU-29 alterno A).

**Criterios de aceptación**
- **Dado** los flujos de HU-29 y HU-30, **cuando** se prueban, **entonces** funcionan igual que antes.
- **Dado** el formulario en 1440 px, **cuando** se muestra, **entonces** mide 760 px como máximo.

---

### HU-48 · Detalle de la orden con mantener presionado

**Historia:** Como **admin o mecánico**, quiero ver el avance de la orden en un dial y cambiar su estado manteniendo presionado, para no equivocarme con un toque.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-ordenes` | Obligatoria | 3 | HU-43, HU-47 |

**Casos de uso**
- *Principal:*
  - `OrdenDetalleVista`: encabezado con el dial de 6 pasos, placa y cliente; línea de tiempo con el estilo nuevo.
  - Las acciones sin texto obligatorio (enviar para aprobación, iniciar reparación, lista, reanudar, entregar, cerrar) se hacen con `HoldButton` directo, sin hoja.
  - Las acciones con texto obligatorio (falta repuesto, cancelar) abren `CambioEstadoSheet`; su botón de confirmar es `HoldButton`.
  - `DiagnosticoSheet` y `ServicioSheet` con el estilo nuevo.
- *Alterno, el servidor rechaza el cambio (409):* se muestra el error y el estado no cambia en pantalla (HU-35).

**Criterios de aceptación**
- **Dado** una orden en reparación, **cuando** el mecánico mantiene «Lista para entregar» y suelta, **entonces** la orden pasa a «Lista para entregar» y el historial lo registra.
- **Dado** «Falta repuesto», **cuando** se abre la hoja, **entonces** no deja confirmar sin escribir el repuesto.
- **Dado** el mismo rol y estado, **cuando** se comparan con antes, **entonces** se ven las mismas acciones (`estados.ts` no cambia).

---

### HU-49 · Seguimiento del cliente

**Historia:** Como **cliente**, quiero ver mis motos y el avance de mi orden como en el prototipo, y aprobar o rechazar el trabajo manteniendo presionado.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-cliente` | Obligatoria | 3 | HU-43, HU-44 |

**Casos de uso**
- *Principal:*
  - `MotosPage` y `MotoCard` con el estilo nuevo.
  - `cliente/OrdenesPage` y el detalle del cliente: isla oscura con 6 segmentos, monto grande en Michroma y mensaje del estado.
  - Esperando aprobación: barra inferior con «Mantén para aprobar $ …» (directo) y «Mantén para rechazar» (abre la hoja del motivo, que es obligatorio).
- *Alterno, orden sin costo todavía:* no se muestra el monto ni los botones.

**Criterios de aceptación**
- **Dado** a Juan con la orden #2 esperando aprobación, **cuando** mantiene «Mantén para aprobar» y suelta, **entonces** la orden queda «Aprobada».
- **Dado** «Mantén para rechazar», **cuando** se abre la hoja, **entonces** no deja confirmar sin motivo.
- **Dado** el flujo de HU-34, **cuando** se prueba, **entonces** funciona igual que antes.

---

### HU-50 · Perfil, páginas de error y revisión final

**Historia:** Como **equipo**, quiero que las pantallas que faltan tengan el diseño nuevo y revisar la app completa, para entregar una versión pareja.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| 6.5 | Por definir | `feature/diseno-cierre` | Obligatoria | 1 | HU-45 a HU-49 |

**Casos de uso**
- *Principal:*
  - Se ajustan `PerfilPage`, `NotFoundPage`, `RouteErrorPage` y `Proximamente`.
  - Se recorre la app con los 3 roles en 360, 390 y 1440 px.
  - Se actualizan `contexto.md` (sección 9) y `docs/diseno.md` si algo cambió.

**Criterios de aceptación**
- **Dado** el guion de HU-40, **cuando** se recorre completo, **entonces** cada pantalla coincide con el prototipo y todo funciona.
- **Dado** el código, **cuando** se busca algo del diseño anterior (cian, naranja, `brand-navy`, Inter, Montserrat), **entonces** no queda nada.

---

## E7 · Despliegue y entrega

### HU-38 · Base de datos en la nube (Aiven)

**Historia:** Como **equipo**, quiero una base MySQL en la nube gratuita, para que la app publicada tenga datos reales.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| — | 15 oct | — | Obligatoria | 1 | HU-06 |

**Casos de uso**
- *Principal:*
  1. Un integrante crea la cuenta en Aiven con el plan gratuito, que no pide tarjeta.
  2. Crea la base MySQL y guarda la cadena de conexión en un lugar seguro del equipo (nunca en el repositorio).
  3. Aplica las migraciones con `prisma migrate deploy` y carga los datos de ejemplo.
- *Alterno, la base se apagó por inactividad:* se enciende desde el panel de Aiven; se revisa antes de cada presentación.

**Criterios de aceptación**
- **Dado** la cadena de Aiven con SSL, **cuando** se ejecuta `prisma migrate deploy`, **entonces** se crean las tablas.
- **Dado** el proceso, **cuando** se revisa, **entonces** no se ingresó ninguna tarjeta ni hubo costo.

> Si Aiven pidiera un pago en algún paso, se detiene y se consulta antes de seguir.

---

### HU-39 · Publicar la app en Vercel

**Historia:** Como **equipo**, quiero la app publicada en una dirección de Vercel con frontend y API en el mismo dominio, para presentarla y que la cookie de sesión funcione.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| — | 16 oct | `chore/despliegue` | Obligatoria | 3 | HU-38, HU-11 |

**Casos de uso**
- *Principal:*
  1. Se crea `api/index.ts`, que exporta la app de Express.
  2. Se agrega `vercel.json` para que `/api/*` vaya a la función y el resto a `index.html`.
  3. Se conecta el repositorio en Vercel (plan Hobby gratuito) y se cargan las variables de entorno.
  4. `main` publica a producción y cada PR genera una vista previa.
- *Alterno A, error de conexión a la base en la función:* se revisa SSL y que haya una sola instancia de Prisma.
- *Alterno B, falla el build:* se revisan los registros de Vercel y se corrige en una rama `fix/`.

**Criterios de aceptación**
- **Dado** la dirección publicada, **cuando** se abre `/api/health`, **entonces** responde 200.
- **Dado** la app publicada, **cuando** se inicia sesión y se recarga la página, **entonces** la sesión sigue (la cookie funciona en el mismo dominio).
- **Dado** la app publicada, **cuando** se abre directamente `/cliente/motos`, **entonces** carga sin 404.
- **Dado** el plan de Vercel, **cuando** se revisa, **entonces** es Hobby, sin costo.

---

### HU-40 · Prueba de punta a punta y versión v0.1

**Historia:** Como **equipo**, quiero recorrer el flujo completo en la app publicada antes de entregar, para presentar algo que funciona de principio a fin.

| Etapa | Fecha | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|---|
| — | 16 oct | `release/v0.1` | Obligatoria | 2 | Todas las obligatorias |

**Casos de uso**
- *Principal:*
  1. Se recorre este guion en celular (390 px) y en computador (1280 px):
     - Se registra un taller y el admin crea un mecánico.
     - El admin registra un cliente con su moto y abre una orden.
     - El mecánico diagnostica y la envía para aprobación.
     - El cliente se registra, ve su moto y aprueba.
     - El mecánico repara, marca que falta un repuesto, reanuda y deja la moto lista.
     - El admin entrega y cierra.
  2. Se repite rechazando el diagnóstico.
- *Alterno, aparece un error:* se abre un issue `fix/`, se corrige y se repite el guion.

**Criterios de aceptación**
- **Dado** el guion, **cuando** se recorre completo, **entonces** cada paso funciona y el historial de la orden muestra el registro inicial y los 9 cambios de estado.
- **Dado** todas las pantallas, **cuando** se revisan en 390 px, **entonces** no hay desplazamiento horizontal ni botones de menos de 48 px.
- **Dado** `develop` estable, **cuando** se une a `main`, **entonces** se crea la etiqueta `v0.1` y el README indica la dirección publicada y las cuentas de prueba.

---

## Fuera de esta entrega (segunda entrega)

Estas funciones existen en el prototipo, pero quedan por fuera de la primera entrega. Las que dependen de servicios pagos se consultan antes de contratar algo.

- OTP por WhatsApp o correo: registro, recuperación de contraseña e invitaciones. Tiene costo.
- Citas y agenda.
- Inventario de repuestos y sus movimientos.
- Alertas de IA y su aprobación por el mecánico, y el chat de diagnóstico con IA. Tiene costo.
- Pagos y membresías. Tiene costo.
- Notificaciones, reportes y landing comercial.
