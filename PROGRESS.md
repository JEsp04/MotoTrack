# PROGRESS.md · Checklist de tareas y roadmap

Detalle y criterios de aceptación de cada historia: `docs/HISTORIAS.md`.
Marca `[x]` solo cuando la historia cumple la *definición de terminado* (`CLAUDE.md`, sección 6) y está unida en `develop`.

Última actualización: 12 de octubre de 2026 (tarde).

Leyenda: `[x]` unida en `develop` · `[~]` hecha y en revisión (PR abierto o por abrir) · `[ ]` pendiente.

## Resumen

| Etapa | Historias | Estado |
|---|---|---|
| E0 · Preparación del repositorio | HU-01 a HU-05 | ✅ En `develop` (10-oct) |
| E1 · Base de datos | HU-06 a HU-07 | ✅ En `develop` (10-oct) |
| E2 · Base del frontend | HU-08 a HU-12 | ✅ En `develop` (10-oct) |
| E3 · Autenticación en backend | HU-13 a HU-18 | ✅ En `develop` (10-oct) |
| E4 · Autenticación en frontend | HU-19 a HU-22 | 🔎 En revisión: rama `feature/auth-frontend` (12-oct) |
| E5 · Usuarios, clientes y motos | HU-23 a HU-27 | ⏳ Siguiente |
| E6 · Órdenes de servicio | HU-28 a HU-37 | ⬜ Pendiente |
| E7 · Despliegue y entrega | HU-38 a HU-40 | ⬜ Pendiente |

**Avance:** 18 de 40 historias · 42 de 88 puntos (≈ 48 %).

---

## Roadmap hacia la primera entrega (viernes 17-oct)

El calendario del 9-oct se reajustó porque E0 a E3 se terminaron el 10-oct.

| Fecha | Plan |
|---|---|
| ~~10–13 oct~~ | ~~E0, E1, E2, E3~~ ✅ terminadas el 10-oct |
| Lun 12 – mar 13 | E4: ingreso, registro, sesión al recargar y acceso por rol |
| Mar 13 – mié 14 | E5: mecánicos, clientes y motos (API + pantallas) |
| Mié 14 – jue 16 | E6: órdenes, estados, diagnóstico e historial |
| Mié 15 | HU-38: base en Aiven (temprano, para probar con datos reales) |
| Jue 16 | HU-39 despliegue en Vercel + HU-40 prueba de punta a punta y `v0.1` |
| Vie 17 | **Primera entrega** |

**Plan de riesgo:** si el 15-oct E6 va atrasada, HU-33 (servicios y costo) pasa a la segunda entrega.

---

## E0 · Preparación del repositorio ✅

- [x] HU-01 · Limpiar el repositorio
- [x] HU-02 · Backend en TypeScript
- [x] HU-03 · Frontend en TypeScript con estructura modular
- [x] HU-04 · Calidad de código y revisión automática
- [x] HU-05 · Variables de entorno documentadas

## E1 · Base de datos ✅

- [x] HU-06 · Esquema Prisma y migración inicial
- [x] HU-07 · Datos de ejemplo (`npm run seed`)

## E2 · Base del frontend ✅

- [x] HU-08 · Tokens de diseño en Tailwind
- [x] HU-09 · Componentes ui reutilizables
- [x] HU-10 · Layouts y navegación por rol
- [x] HU-11 · Rutas, carga diferida y página 404
- [x] HU-12 · Cliente HTTP y manejo de errores

## E3 · Autenticación en backend ✅

- [x] HU-13 · Registrar un taller con su administrador
- [x] HU-14 · Registrarme como cliente
- [x] HU-15 · Iniciar sesión
- [x] HU-16 · Mantener la sesión abierta (renovación)
- [x] HU-17 · Cerrar sesión
- [x] HU-18 · Ver mi perfil y proteger por rol

## E4 · Autenticación en frontend 🔎 (hecha, falta PR a `develop`)

- [~] HU-19 · Pantalla de inicio de sesión
- [~] HU-20 · Pantallas de registro (taller en 2 pasos y cliente)
- [~] HU-21 · Sesión que sobrevive a recargar la página
- [~] HU-22 · Acceso según mi rol y botón de salir

### Mejora transversal (12-oct) 🔎 rama `feature/validaciones-publicid`

- [~] `publicId` UUIDv7 en talleres, usuarios, clientes, motocicletas y órdenes (se conservan los `Int`)
- [~] Largo máximo en todos los campos y `maxLength` en los inputs

## E5 · Usuarios, clientes y motos

- [ ] HU-23 · Crear cuentas de mecánico
- [ ] HU-24 · Registrar un cliente en el taller
- [ ] HU-25 · Buscar y ver clientes
- [ ] HU-26 · Registrar una moto
- [ ] HU-27 · Ver mis motos como cliente

## E6 · Órdenes de servicio

- [ ] HU-28 · Motor de estados e historial (backend)
- [ ] HU-29 · Crear una orden de servicio
- [ ] HU-30 · Ver la lista de órdenes
- [ ] HU-31 · Ver el detalle y el historial de una orden
- [ ] HU-32 · Registrar el diagnóstico
- [ ] HU-33 · Agregar servicios y calcular el costo *(deseable)*
- [ ] HU-34 · Aprobar o rechazar el diagnóstico
- [ ] HU-35 · Avanzar la reparación
- [ ] HU-36 · Entregar y cerrar la orden
- [ ] HU-37 · Cancelar una orden con motivo

## E7 · Despliegue y entrega

- [ ] HU-38 · Base de datos en la nube (Aiven, gratis)
- [ ] HU-39 · Publicar la app en Vercel (Hobby, gratis)
- [ ] HU-40 · Prueba de punta a punta y versión `v0.1`

---

## Tareas del equipo (fuera de las historias)

- [ ] Cada integrante configura su entorno: `git pull`, `npm install`, `.env`, `CREATE DATABASE mototrack`, `npm run db:deploy` y `npm run seed`
- [ ] Integrar la landing page de un compañero (moverla a `frontend/src/pages/LandingPage.tsx` en una rama nueva desde `develop`)
- [ ] Poner `develop` como rama por defecto en GitHub (Settings → General), para no abrir PRs hacia `main` por error
- [ ] Proteger `develop`: exigir 1 revisión y la revisión automática en verde
- [ ] Definir quién lleva cada etapa de E4 a E7

## Segunda entrega (backlog)

- [ ] Citas y agenda
- [ ] Inventario de repuestos y movimientos
- [ ] Alertas IA y chat de diagnóstico *(cuesta dinero: consultar antes)*
- [ ] OTP por WhatsApp o correo, invitación de mecánicos y recuperar contraseña *(cuesta dinero: consultar antes)*
- [ ] Pagos y membresías *(cuesta dinero: consultar antes)*
- [ ] Notificaciones, reportes y landing comercial
