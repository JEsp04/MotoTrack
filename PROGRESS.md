# PROGRESS.md · Checklist de tareas y roadmap

Detalle y criterios de aceptación de cada historia: `docs/HISTORIAS.md` (50 historias, 112 puntos: las 40 originales más E6.5, agregada el 17-oct). Diseño: `docs/diseno.md` y `docs/prototipo/`.
Marca `[x]` solo cuando la historia cumple la *definición de terminado* (`CLAUDE.md`, sección 6) y está unida en `develop`.

Última actualización: sábado 24 de octubre de 2026.

Leyenda: `[x]` unida en `develop` · `[~]` hecha y en revisión (PR abierto o por abrir) · `[ ]` pendiente.

## Resumen

| Etapa | Historias | Pts | Estado |
|---|---|---|---|
| E0 · Preparación del repositorio | HU-01 a HU-05 | 9 | ✅ En `develop` (10-oct) |
| E1 · Base de datos | HU-06 a HU-07 | 7 | ✅ En `develop` (10-oct) |
| E2 · Base del frontend | HU-08 a HU-12 | 13 | ✅ En `develop` (10-oct) |
| E3 · Autenticación en backend | HU-13 a HU-18 | 13 | ✅ En `develop` (10-oct) |
| E4 · Autenticación en frontend | HU-19 a HU-22 | 9 | ✅ En `develop` (12-oct, PR #10) |
| E5 · Usuarios, clientes y motos | HU-23 a HU-27 | 10 | ✅ En `develop` (12-oct, PR #12) |
| E6 · Órdenes de servicio | HU-28 a HU-37 | 21 | ✅ En `develop` (12-oct, PR #13) |
| E6.5 · Migración al diseño nuevo | HU-41 a HU-50 | 24 | ✅ En `develop` (24-oct, PR #16 a #25) |
| E7 · Despliegue y entrega | HU-38 a HU-40 | 6 | ⏳ Pendiente: no hay nada de despliegue en el repositorio |

**Avance:** 47 de 50 historias unidas · 106 de 112 puntos (≈ 95 %). Solo faltan las 3 historias de E7 (6 puntos), todas obligatorias.

---

## Roadmap para cerrar el entregable

La fecha de la primera entrega en `docs/HISTORIAS.md` era el viernes 17-oct. Ese día se agregó **E6.5 · Migración al diseño nuevo**, que iba antes de E7; se desarrolló el 17 y 18-oct y se unió el 24-oct. E7 sigue sin hacerse (no existen `api/index.ts`, `vercel.json` ni la etiqueta `v0.1`). **Hay que acordar una fecha nueva con el equipo.**

| Paso | Historia | Depende de | Estado |
|---|---|---|---|
| ✅ | E6.5 · HU-41 a HU-50 · Migración al diseño nuevo (24 pts) | E6 | ✅ Unida el 24-oct |
| 2 | HU-38 · Base en Aiven (gratis, sin tarjeta) | HU-06 | ⏳ Pedir confirmación antes de crear la cuenta |
| 3 | HU-39 · Publicar en Vercel Hobby (rama `chore/despliegue`) | HU-38, HU-11 | ⏳ Pedir confirmación antes de crear la cuenta |
| 4 | HU-40 · Prueba de punta a punta y `v0.1` (rama `release/v0.1`) | Todas las obligatorias | ⏳ |

~~Plan de riesgo: HU-33 pasa a la segunda entrega~~ Ya no aplica: HU-33 *(deseable)* quedó unida con E6.

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

## E4 · Autenticación en frontend ✅

- [x] HU-19 · Pantalla de inicio de sesión
- [x] HU-20 · Pantallas de registro (taller en 2 pasos y cliente)
- [x] HU-21 · Sesión que sobrevive a recargar la página
- [x] HU-22 · Acceso según mi rol y botón de salir

## E5 · Usuarios, clientes y motos ✅

- [x] HU-23 · Crear cuentas de mecánico
- [x] HU-24 · Registrar un cliente en el taller
- [x] HU-25 · Buscar y ver clientes
- [x] HU-26 · Registrar una moto (el alterno B, desde el formulario de la orden, llegó con E6 en el PR #13)
- [x] HU-27 · Ver mis motos como cliente

## E6 · Órdenes de servicio ✅ PR #13

- [x] HU-28 · Motor de estados e historial (backend)
- [x] HU-29 · Crear una orden de servicio
- [x] HU-30 · Ver la lista de órdenes
- [x] HU-31 · Ver el detalle y el historial de una orden
- [x] HU-32 · Registrar el diagnóstico
- [x] HU-33 · Agregar servicios y calcular el costo *(deseable)*
- [x] HU-34 · Aprobar o rechazar el diagnóstico
- [x] HU-35 · Avanzar la reparación
- [x] HU-36 · Entregar y cerrar la orden
- [x] HU-37 · Cancelar una orden con motivo

## E6.5 · Migración al diseño nuevo ✅ PR #16 a #25

Solo cambia cómo se ven las pantallas (más la landing); el backend no cambia. Una rama por historia (`HU-41` … `HU-50`).

- [x] HU-41 · Colores y fuentes nuevos (PR #16)
- [x] HU-42 · Componentes base con el diseño nuevo (PR #17)
- [x] HU-43 · Botón de mantener presionado y arco de progreso (PR #18)
- [x] HU-44 · Navegación nueva (PR #19)
- [x] HU-45 · Landing, ingreso y registro con el diseño nuevo (PR #20)
- [x] HU-46 · Panel del taller, clientes y equipo (PR #21)
- [x] HU-47 · Lista de órdenes y recibir moto (PR #22)
- [x] HU-48 · Detalle de la orden con mantener presionado (PR #23)
- [x] HU-49 · Seguimiento del cliente (PR #24)
- [x] HU-50 · Perfil, páginas de error y revisión final (PR #25)

## Mejoras transversales ✅

- [x] `publicId` UUIDv7 en talleres, usuarios, clientes, motocicletas y órdenes, y largo máximo en campos e inputs (12-oct, PR #11)
- [x] `publicId` también en `servicios` y `detalle_servicios` (12-oct, PR #13)
- [x] Guardián de tokens de color: `npm run check:tokens` (12-oct, PR #14)
- [x] Pruebas del backend sin mocks de Prisma, bloqueado por ESLint (12-oct, PR #15)
- [x] Se borra el duplicado `docs/CONTEXTO.md` (16-oct)

## E7 · Despliegue y entrega ⏳

Cada casilla es un criterio de aceptación de `docs/HISTORIAS.md`. Con las reglas nuevas, las ramas pueden llamarse `HU-38`, `HU-39` y `HU-40`.

- [ ] HU-38 · Base de datos en la nube (Aiven, gratis) · 1 pt
  - [ ] Cuenta en Aiven con plan gratuito, sin tarjeta ni costo *(consultar antes)*
  - [ ] Cadena de conexión con SSL guardada fuera del repositorio
  - [ ] `prisma migrate deploy` crea las tablas y se cargan los datos de ejemplo
- [ ] HU-39 · Publicar la app en Vercel (Hobby, gratis) · 3 pts · rama `chore/despliegue`
  - [ ] `api/index.ts` exporta la app de Express y `vercel.json` manda `/api/*` a la función y el resto a `index.html`
  - [ ] Repositorio conectado en Vercel con las variables de entorno; `main` publica y cada PR tiene vista previa
  - [ ] `/api/health` responde 200 en la dirección publicada
  - [ ] Al iniciar sesión y recargar, la sesión sigue (cookie en el mismo dominio)
  - [ ] Abrir directamente `/cliente/motos` carga sin 404
  - [ ] El plan es Hobby, sin costo
- [ ] HU-40 · Prueba de punta a punta y versión `v0.1` · 2 pts · rama `release/v0.1`
  - [ ] Guion completo en 390 px y 1280 px: taller y mecánico → cliente, moto y orden → diagnóstico → el cliente se registra y aprueba → reparación con repuesto faltante → lista → entrega y cierre
  - [ ] El historial muestra el registro inicial y los 9 cambios de estado
  - [ ] Se repite el guion rechazando el diagnóstico
  - [ ] En 390 px no hay desplazamiento horizontal ni botones de menos de 48 px
  - [ ] `develop` se une a `main`, se crea la etiqueta `v0.1` y el README tiene la dirección publicada y las cuentas de prueba

---

## Tareas del equipo (fuera de las historias)

- [ ] Acordar la fecha nueva para terminar E7 y quién la lleva
- [ ] Cada integrante actualiza su entorno con `develop`: `git pull`, `npm install`, `.env`, `CREATE DATABASE mototrack`, `npm run db:deploy` y `npm run seed`
- [ ] Corregir los enlaces a `docs/CONTEXTO.md` (borrado el 16-oct) en `README.md` y `docs/HISTORIAS.md`: ahora es `contexto.md` en la raíz. El resumen de `HISTORIAS.md` también dice todavía «40 historias, 88 puntos»
- [ ] Decidir qué pasa con la landing del compañero: la del prototipo ya quedó integrada en HU-45 (`features/landing`)
- [ ] Poner `develop` como rama por defecto en GitHub (Settings → General), para no abrir PRs hacia `main` por error
- [ ] Proteger `develop`: exigir 1 revisión y la revisión automática en verde

## Segunda entrega (backlog, «Fuera de esta entrega» en `docs/HISTORIAS.md`)

- [ ] Citas y agenda
- [ ] Inventario de repuestos y movimientos
- [ ] Alertas IA y chat de diagnóstico *(cuesta dinero: consultar antes)*
- [ ] OTP por WhatsApp o correo, invitación de mecánicos y recuperar contraseña *(cuesta dinero: consultar antes)*
- [ ] Pagos y membresías *(cuesta dinero: consultar antes)*
- [ ] Notificaciones, reportes y landing comercial
- [ ] Lo que el prototipo muestra y la app aún no tiene: fecha estimada de entrega, suscripción y modo oscuro
- [ ] Servicios adicionales en una orden ya aprobada (hoy hay que cancelar y abrir otra, HU-33 alterno B)
