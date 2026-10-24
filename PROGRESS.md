# PROGRESS.md · Checklist de tareas y roadmap

Detalle y criterios de aceptación de cada historia: `docs/HISTORIAS.md` (50 historias, 112 puntos: las 40 originales más E6.5, agregada el 17-oct) y `docs/HISTORIAS-2.md` (segunda etapa, HU-51 a HU-81). Reparto: `docs/REPARTO.md`. Guía de cada sesión: `docs/FLUJO.md`. Diseño: `docs/diseno.md` y `docs/prototipo/`.
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
| E8 · Inventario de repuestos | HU-51 a HU-56 | 16 | ⏳ A · `docs/HISTORIAS-2.md` |
| E9 · Citas y agenda | HU-57 a HU-60 | 11 | ⏳ V |
| E10 · El día a día del taller | HU-61 a HU-68 | 16 | ⏳ V (61, 62, 63, 65, 66), A (64, 68), J (67) |
| E11 · Avisos, reportes y ajustes | HU-69 a HU-75 | 16 | ⏳ J |
| E12 · Funciones con costo | HU-76 a HU-81 | 21 | ⛔ Solo si se aprueba el gasto |
| E7 · Despliegue y entrega | HU-38 a HU-40 | 6 | ⏳ De última: A (HU-38), V (HU-39), J (HU-40) |

**Avance del primer entregable:** 47 de 50 historias unidas · 106 de 112 puntos (≈ 95 %). Faltan las 3 historias de E7 (6 puntos), todas obligatorias.
**Segunda etapa:** 0 de 25 historias sin costo (59 puntos).

---

## Roadmap

**Decisión del 24-oct:** antes de E7 van las historias nuevas HU-51 a HU-75, en 3 rondas. E7 queda de última. Cada ronda termina cuando sus PR están unidos en `develop`. Falta acordar fechas con el equipo.

| Ronda | A · Inventario y mecánico | V · Citas y cliente | J · Avisos y taller |
|---|---|---|---|
| 1 · Tablas y API | HU-51 → HU-52 → HU-53 (8) | HU-57 → HU-62 → HU-66 (7) | HU-73 → HU-69 → HU-67 (8) |
| 2 · Pantallas | HU-54 → HU-55 → HU-64 (8) | HU-58 → HU-59 → HU-60 (8) | HU-70 → HU-71 → HU-72 (6) |
| 3 · Integración | HU-68 → HU-56 (4) | HU-61 → HU-63 → HU-65 (5) | HU-74 → HU-75 (5) |
| E7 · Despliegue | HU-38 · Aiven (1) | HU-39 · Vercel (3) | HU-40 · Guion y `v0.1` (2) |

- HU-51 (A) es la primera migración de la ronda 1; las migraciones van una a la vez (`docs/REPARTO.md`, sección 3).
- HU-73 (J) va primero: el menú «Más» lo necesitan HU-54 (A) y HU-58 (V).
- HU-75 (J) espera a HU-61 (V) y HU-68 (A), que se entregan al inicio de la ronda 3.
- Aiven y Vercel: pedir confirmación antes de crear las cuentas.
- Revisiones cruzadas: A revisa a V, V revisa a J y J revisa a A.

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

## Segunda etapa (`docs/HISTORIAS-2.md`) ⏳

Entre corchetes, quién la lleva y en qué ronda (`docs/REPARTO.md`).

### E8 · Inventario de repuestos · 16 pts

- [ ] HU-51 · Tablas de repuestos y movimientos · 3 pts · [A, ronda 1, primera migración]
- [ ] HU-52 · API de repuestos y stock crítico · 3 pts · [A, ronda 1]
- [ ] HU-53 · Registrar entradas, salidas y ajustes de stock · 2 pts · [A, ronda 1]
- [ ] HU-54 · Pantalla de inventario · 3 pts · [A, ronda 2, necesita HU-73]
- [ ] HU-55 · Registrar un repuesto nuevo · 2 pts · [A, ronda 2]
- [ ] HU-56 · Repuestos en la cotización del diagnóstico · 3 pts · [A, ronda 3]

### E9 · Citas y agenda · 11 pts

- [ ] HU-57 · Tabla y API de citas · 3 pts · [V, ronda 1]
- [ ] HU-58 · Agenda de citas del taller · 3 pts · [V, ronda 2, necesita HU-73]
- [ ] HU-59 · Pedir una cita como cliente · 3 pts · [V, ronda 2]
- [ ] HU-60 · Ver, reprogramar y cancelar mis citas · 2 pts · [V, ronda 2]

### E10 · El día a día del taller · 16 pts

- [ ] HU-61 · Ficha de la moto con su historial · 2 pts · [V, ronda 3, al inicio: J la necesita]
- [ ] HU-62 · Fecha estimada de entrega y aviso de atraso · 2 pts · [V, ronda 1]
- [ ] HU-63 · Reasignar el mecánico de una orden *(deseable)* · 1 pt · [V, ronda 3]
- [ ] HU-64 · Inicio del mecánico · 3 pts · [A, ronda 2]
- [ ] HU-65 · Inicio del cliente · 2 pts · [V, ronda 3]
- [ ] HU-66 · Código de retiro para entregar la moto · 2 pts · [V, ronda 1]
- [ ] HU-67 · Invitar usuarios al taller con un código · 3 pts · [J, ronda 1]
- [ ] HU-68 · Contactar al cliente por WhatsApp sin costo *(deseable)* · 1 pt · [A, ronda 3, al inicio: J la necesita]

### E11 · Avisos, reportes y ajustes · 16 pts

- [ ] HU-69 · Avisos automáticos al cambiar el estado · 3 pts · [J, ronda 1]
- [ ] HU-70 · Pantalla de avisos · 2 pts · [J, ronda 2]
- [ ] HU-71 · Reportes del taller · 3 pts · [J, ronda 2]
- [ ] HU-72 · Exportar el reporte a Excel *(deseable)* · 1 pt · [J, ronda 2]
- [ ] HU-73 · Menú «Más» y datos del taller · 2 pts · [J, ronda 1, va primero]
- [ ] HU-74 · Tema oscuro *(deseable)* · 2 pts · [J, ronda 3]
- [ ] HU-75 · Recordatorios de mantenimiento (por reglas, sin IA) · 3 pts · [J, ronda 3, espera HU-61 y HU-68]

### E12 · Funciones con costo · 21 pts *(solo si se aprueba el gasto; no asignadas)*

- [ ] HU-76 · Recuperar la contraseña con un código · 3 pts · [J si se aprueba]
- [ ] HU-77 · Verificar el celular con un código · 3 pts · [J si se aprueba]
- [ ] HU-78 · Fotos en el diagnóstico · 2 pts · [A si se aprueba]
- [ ] HU-79 · Asistente IA de diagnóstico · 5 pts · [A si se aprueba]
- [ ] HU-80 · Plan del taller y facturas · 3 pts · [V si se aprueba]
- [ ] HU-81 · Pagar con tarjeta, PSE o Nequi · 5 pts · [V si se aprueba]

---

## Tareas del equipo (fuera de las historias)

- [ ] Acordar las fechas de las rondas 1 a 3 y de E7
- [ ] Decidir si el guion de HU-40 suma cita, repuesto en la cotización, aviso al cliente y código de retiro
- [ ] Cada integrante actualiza su entorno con `develop`: `git pull`, `npm install`, `.env`, `CREATE DATABASE mototrack`, `npm run db:deploy` y `npm run seed`
- [ ] Corregir los enlaces a `docs/CONTEXTO.md` (borrado el 16-oct) en `README.md` y `docs/HISTORIAS.md`: ahora es `contexto.md` en la raíz. El resumen de `HISTORIAS.md` también dice todavía «40 historias, 88 puntos»
- [ ] Decidir qué pasa con la landing del compañero: la del prototipo ya quedó integrada en HU-45 (`features/landing`)
- [ ] Poner `develop` como rama por defecto en GitHub (Settings → General), para no abrir PRs hacia `main` por error
- [ ] Proteger `develop`: exigir 1 revisión y la revisión automática en verde

## Backlog que aún no tiene historia

Citas, inventario, avisos, reportes, invitaciones, fecha estimada, tema oscuro, IA, OTP y pagos ya tienen historia en `docs/HISTORIAS-2.md` (ver arriba). Queda sin historia:

- [ ] Landing comercial
- [ ] Servicios adicionales en una orden ya aprobada (hoy hay que cancelar y abrir otra, HU-33 alterno B)
