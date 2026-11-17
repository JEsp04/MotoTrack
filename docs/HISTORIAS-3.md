# MotoTrack · Historias de usuario de la tercera etapa (HU-82 a HU-91)

> Historias nacidas de la auditoría exploratoria de usuario del 16-nov-2026 sobre los 4 perfiles (**Visitante**, **Cliente**, **Mecánico** y **Administrador**) en móvil (`390×844`) y escritorio (`1280×800`).
> Cubre las 22 reseñas detectadas (`RES-01` a `RES-22`), el módulo de reseñas post-entrega y los casos de uso que no estaban cubiertos en `docs/HISTORIAS.md` ni en `docs/HISTORIAS-2.md`.
> Última actualización: lunes 16 de noviembre de 2026.

---

## Cómo leer este documento

Sigue el mismo formato que `docs/HISTORIAS.md` y `docs/HISTORIAS-2.md`: historia, ficha, casos de uso y criterios *Dado / Cuando / Entonces*. Una historia solo se cierra cuando cumple **todos** sus criterios y la *Definición de terminado* (`CLAUDE.md`, sección 6).

**Reglas de ejecución de esta etapa (E13):**

1. **Sin costo externo (`$ 0`):** ninguna de las 10 historias requiere servicios pagos, cuentas en la nube nuevas ni pasarelas.
2. **Plan secuencial en 4 fases (ejecutado por A):** se desarrolla una rama `HU-<número>` a la vez desde `develop`, empezando por las 3 primeras fases (que no tocan `schema.prisma`) y dejando la migración de `HU-89` (`resenas_orden`) en la Fase 4 para no chocar con otras ramas.
3. **Criterios comunes a todas las historias con pantalla:**
   - **Dado** el código, **cuando** se corre `npm run check:tokens`, **entonces** pasa.
   - **Dado** 360, 390 y 1440 px, **cuando** se recorre la pantalla, **entonces** no hay desplazamiento horizontal de página y los controles interactivos miden al menos `48 px` (`min-h-touch`).
   - **Dado** «reducir movimiento» activo, **cuando** se usa la pantalla, **entonces** todo sigue funcionando sin bloqueos.
4. **Criterios comunes a todas las historias con backend:**
   - Toda consulta filtra por `tallerId`; un recurso de otro taller o `publicId` inválido responde **404**.
   - Hacia afuera solo `publicId` (UUIDv7); nunca los `Int`.
   - Cada texto tiene `.max()` en Zod igual al largo de la columna en `schema.prisma`.
   - Pruebas contra MySQL real (`TEST_DATABASE_URL`) con Vitest y Supertest, sin mocks de Prisma.

---

## Resumen

| ID | Historia | Etapa | Fase | Prioridad | Pts | Reseñas que cubre | Migración |
|---|---|---|---|---|---|---|---|
| **E13 · Experiencia de usuario, reseñas y casos de uso completos** ||||||||
| HU-82 | Correcciones móviles (`390 px`), áreas táctiles (`48 px`) y barras fijas | 13 | 1 | Obligatoria | 3 | `RES-01`, `RES-04`, `RES-05`, `RES-06` | No |
| HU-83 | Coherencia de landing, acceso, registro e invitaciones seguras | 13 | 1 | Obligatoria | 2 | `RES-08`, `RES-09`, `RES-10`, `RES-13`, `RES-22` | No |
| HU-84 | Seguimiento completo del cliente y contacto directo con el taller | 13 | 2 | Obligatoria | 3 | `RES-03`, `RES-07`, `RES-11`, `RES-12`, `RES-21`, `RES-22` | No |
| HU-85 | Mejoras operativas del Panel del taller e Inicio del mecánico | 13 | 2 | Obligatoria | 2 | `RES-10`, `RES-14`, `RES-15` | No |
| HU-86 | Autogestión de perfil, cambio de contraseña y restablecimiento asistido | 13 | 3 | Obligatoria | 3 | `RES-02`, `RES-17` | No |
| HU-87 | Gestión completa de inventario, motos, clientes y equipo | 13 | 3 | Obligatoria | 3 | `RES-18` | No |
| HU-88 | Ítems adicionales en orden aprobada o en reparación | 13 | 3 | Obligatoria | 3 | `RES-19` | No |
| HU-89 | Reseñas y calificación del servicio al entregar o cerrar la orden | 13 | 4 | Obligatoria | 3 | `RES-16` | Sí (`resenas_orden`) |
| HU-90 | Seguimiento público sin cuenta y comprobante imprimible | 13 | 4 | Deseable | 2 | `RES-20` | No |
| HU-91 | Soporte multi-taller para cuentas de cliente | 13 | 4 | Deseable | 2 | `RES-21` | No |

**Total E13 (sin costo):** 10 historias, **26 puntos** (8 obligatorias = 22 pts · 2 deseables = 4 pts).

---

## Plan de desarrollo secuencial (4 fases)

| Fase | Orden de ramas | Objetivo del bloque | Archivos principales |
|---|---|---|---|
| **Fase 1 · Estabilización móvil y acceso** | `HU-82` → `HU-83` (5 pts) | Eliminar errores prematuros en formularios por pasos, solapamientos de barras fijas, pestañas menores de `48 px`, el `401` anónimo en consola y duplicados de invitación por teléfono. | `Page.tsx`, `Tabs.tsx`, `NuevaOrdenForm.tsx`, `StockRow.tsx`, `App.tsx`, `Landing.tsx`, `RegistroPage.tsx`, `LoginPage.tsx`, `LoginForm.tsx`, `UnirseTaller.tsx`, `InvitacionesLista.tsx`, `InvitarUsuario.tsx`, `invitaciones.service.ts` |
| **Fase 2 · Comunicación cliente y paneles** | `HU-84` → `HU-85` (5 pts) | Dar al cliente contacto directo con el taller (`wa.me` / `tel:`), fecha de atraso en inicio, motivo de cancelación, historial, buscador y filtros directos en los KPIs del mecánico y del admin. | `ordenes.service.ts`, `OrdenClienteCard.tsx`, `OrdenCard.tsx`, `OrdenesLista.tsx`, `SeguimientoCliente.tsx`, `OrdenDetalleVista.tsx`, `InicioMecanico.tsx`, `PanelTaller.tsx`, `ServicioSheet.tsx`, `ClienteDetallePage.tsx`, `whatsapp.ts` |
| **Fase 3 · Autogestión, edición y adicionales** | `HU-86` → `HU-87` → `HU-88` (9 pts) | Permitir editar perfil propio, cambiar clave, restablecer claves desde el admin, editar/inactivar repuestos, borrar motos sin órdenes y agregar ítems adicionales tras aprobar la cotización. | `auth.*`, `usuarios.*`, `motos.*`, `ordenes.service.ts`, `estados.ts`, `PerfilPage.tsx`, `EquipoPage.tsx`, `RepuestoSheet.tsx`, `QuantityStepper.tsx`, `MotoSheet.tsx` |
| **Fase 4 · Reseñas, comprobante y multi-taller** | `HU-89` → `HU-90` → `HU-91` (7 pts) | Calificación y reseñas de clientes al cerrar la orden con bandeja de adaptación para administradores, enlace público de seguimiento sin cuenta, comprobante imprimible y cliente multi-taller. | `schema.prisma`, `seed.ts`, módulo `resenas` (o en `ordenes`), `SeguimientoCliente.tsx`, `ResenasPage.tsx`, `router/index.tsx`, `router/nav.ts` |

---

## E13 · Experiencia de usuario, reseñas y casos de uso completos

### HU-82 · Correcciones móviles (`390 px`), áreas táctiles (`48 px`) y barras de acción fijas

**Historia:** Como **usuario en celular**, quiero que ningún botón fijo tape los montos ni las tarjetas, que las pestañas midan al menos `48 px` y que los formularios por pasos no disparen errores antes de tiempo, para usar la app cómodamente con una mano.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-82` | Obligatoria | 3 | HU-47, HU-48, HU-54 |

**Casos de uso**
- *Principal:*
  1. En `NuevaOrdenForm.tsx`, separar con `key` distinta el botón «Continuar» (pasos 1 y 2) del botón «Crear orden» (`type="submit"`, paso 3), evitando que React reutilice el mismo nodo DOM y dispare el envío del formulario apenas se monta el Paso 3.
  2. En `Page.tsx`, ampliar el margen inferior cuando hay `ActionBar` apilado en columna (`SeguimientoCliente.tsx`, `OrdenDetalleVista.tsx`) y cuando hay `Fab` (`/admin/ordenes`, `/admin/equipo`), para que la fila `Total` y la última tarjeta queden siempre visibles al hacer scroll.
  3. En `Tabs.tsx` y en los enlaces de acción de `InicioMecanico.tsx` y `LoginPage.tsx`, asegurar altura táctil mínima `min-h-touch` (`48 px`) y mostrar un indicador visual cuando las pestañas se desplazan horizontalmente en `390 px`.
  4. En el Paso 2 de `NuevaOrdenForm.tsx` y en `StockRow.tsx`, permitir que el chip de estado o la alerta «Stock crítico» se acomode sin aplastar el nombre de la moto ni truncar el texto en `390 px`.

**Criterios de aceptación**
- **Dado** el asistente «Nueva orden» en el Paso 2 con una moto seleccionada, **cuando** el admin pulsa «Continuar» para ir al Paso 3, **entonces** «Motivo de ingreso» y «Mecánico asignado» aparecen sin errores hasta que el usuario interactúe o envíe el formulario.
- **Dado** una orden en `esperando_aprobacion` en `390×844`, **cuando** el cliente baja hasta el final de la cotización, **entonces** la fila `Total` queda completamente visible por encima de la barra fija de aprobación/rechazo.
- **Dado** las pestañas de filtro e inventario en `390×844`, **cuando** se mide su área táctil, **entonces** cada pestaña tiene al menos `48 px` de alto y los nombres de motos y alertas de stock crítico se leen sin aplastamiento.

---

### HU-83 · Coherencia de landing, acceso, registro e invitaciones seguras

**Historia:** Como **visitante o administrador**, quiero que el registro respete el flujo real de invitaciones y el plan elegido, sin errores `401` en consola ni invitaciones duplicadas al mismo celular, para confiar en el sistema desde el primer ingreso.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-83` | Obligatoria | 2 | HU-20, HU-45, HU-67 |

**Casos de uso**
- *Principal:*
  1. Evitar que `App.tsx` dispare un error `401 (Unauthorized)` en consola cuando un visitante sin sesión previa abre `/` (consultando una marca no sensible de sesión activa antes de invocar `/api/auth/refresh`, o respondiendo sin error cuando no hay cookie).
  2. En `Landing.tsx`, pasar el plan seleccionado a `/registro/taller?plan=basico|inteligente`, mostrar el plan elegido en el encabezado del registro y etiquetar como «Próximamente» las funciones que pertenecen a etapas posteriores.
  3. En `RegistroPage.tsx`, cambiar la opción «Trabajo en un taller» para que explique el ingreso mediante invitación y lleve a `/unirse`.
  4. En `LoginPage.tsx` y `LoginForm.tsx`, limpiar el estado y las alertas al cambiar entre «Soy del taller» y «Soy cliente», conservar `?tab=cliente` al cerrar sesión desde una cuenta de cliente, y distinguir el texto de «¿Olvidaste tu contraseña?» según la pestaña.
  5. En `UnirseTaller.tsx`, reemplazar el ejemplo `8Q2K` en el mensaje de código inválido por un ejemplo que no coincida con el seed (`M4K9`), permitir consultar en una hoja los términos de uso y política de datos (también en `/registro/cliente`), y asegurar que el error de «Tu taller» se muestre debajo del selector.
  6. En `invitaciones.service.ts`, responder `409` si ya existe una invitación `pendiente` vigente para el mismo `telefono` en ese taller; en `InvitacionesLista.tsx`, ocultar «Cancelar» en invitaciones ya vencidas y pedir confirmación antes de cancelar una pendiente; en `InvitarUsuario.tsx`, corregir `"Hola ,"` cuando el nombre está vacío, ajustar la nota sobre el registro de clientes y agregar botón «Copiar mensaje».

**Criterios de aceptación**
- **Dado** un visitante sin sesión previa, **cuando** abre `/`, **entonces** la consola del navegador no registra ningún error `401`.
- **Dado** un usuario en `/registro`, **cuando** toca «Trabajo en un taller», **entonces** navega a `/unirse` para escribir su código de invitación.
- **Dado** una invitación `pendiente` vigente para el celular `3119024471`, **cuando** el admin intenta enviar otra invitación al mismo celular en su taller, **entonces** responde `409` indicando que ya existe una invitación activa para ese número.
- **Dado** la lista de invitaciones en `/admin/equipo?tab=invitaciones`, **cuando** una invitación está `vencida`, **entonces** solo muestra «Reenviar», y al pulsar «Cancelar» en una `pendiente` pide confirmación antes de anularla.

---

### HU-84 · Seguimiento completo del cliente y contacto directo con el taller

**Historia:** Como **cliente**, quiero ver los datos de contacto del taller, la fecha estimada en mi inicio, el detalle completo de mi orden y un buscador en mis órdenes, para resolver dudas antes de aprobar una cotización y saber cuándo y dónde recoger mi moto.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-84` | Obligatoria | 3 | HU-31, HU-49, HU-62, HU-68 |

**Casos de uso**
- *Principal:*
  1. En `OrdenClienteCard.tsx` (`/cliente`), mostrar la fecha estimada de entrega y resaltar en rojo cuando `orden.atrasada` sea `true`.
  2. En `OrdenCard.tsx`, cuando `rol === 'cliente'`, mostrar el nombre del taller (o el motivo de ingreso) debajo de la moto en lugar del nombre del propio cliente, y habilitar el buscador en `OrdenesLista.tsx` para el rol `cliente`.
  3. En `GET /api/ordenes/:id`, incluir los datos de contacto del taller (`nombre`, `telefono`, `direccion`, `horarioAtencion`) cuando consulta el cliente dueño.
  4. En `SeguimientoCliente.tsx`, mostrar:
     - Tarjeta/acciones de contacto con el taller: **«Escribir por WhatsApp»** (`wa.me`), **«Llamar al taller»** (`tel:`), dirección y horario de atención.
     - Resumen completo de la orden: motivo de ingreso, kilometraje y fecha de ingreso, mecánico asignado, `trabajoRecomendado`, motivo de cancelación (cuando está `cancelada`) e historial de estados.
     - Texto diferenciado entre `aprobada` (*«Aprobada · En turno para iniciar reparación»*) y `en_reparacion` (*«En reparación · Paso 4 de 6»*).
  5. En `OrdenDetalleVista.tsx` («Compartir cotización»), agregar botón «Copiar mensaje» y en `ClienteDetallePage.tsx` agregar enlaces rápidos `Llamar` y `WhatsApp` en la tarjeta `Contacto`.

**Criterios de aceptación**
- **Dado** una orden en `esperando_aprobacion`, `atrasada` o `lista_entrega`, **cuando** el cliente abre `/cliente/ordenes/:id`, **entonces** ve los botones para escribir por WhatsApp o llamar al taller junto con su dirección y horario.
- **Dado** una orden `cancelada`, **cuando** el cliente abre su seguimiento, **entonces** ve la observación/motivo por el cual se canceló y el historial de la orden.
- **Dado** el cliente en `/cliente` y `/cliente/ordenes`, **cuando** revisa sus tarjetas, **entonces** ve la alerta de atraso en el inicio, el taller/motivo en lugar de su propio nombre en la lista y puede buscar por placa o número.

---

### HU-85 · Mejoras operativas del Panel del taller (`/admin`) e Inicio del mecánico (`/mecanico`)

**Historia:** Como **administrador o mecánico**, quiero que los indicadores del inicio filtren la lista al tocarlos, que las órdenes atrasadas o el stock crítico resalten de inmediato y que la cola de trabajo solo muestre lo pendiente por hacer, para operar el taller sin pasos extra.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-85` | Obligatoria | 2 | HU-46, HU-54, HU-64 |

**Casos de uso**
- *Principal:*
  1. En `InicioMecanico.tsx` (`/mecanico`):
     - Cada lectura superior enlaza a `/mecanico/ordenes` aplicando su filtro (`?grupo=...`).
     - Excluir las órdenes en `lista_entrega` de «Mi cola de trabajo».
     - Confirmar «Falta repuesto» con `HoldButton` dentro de su hoja; mostrar en `OrdenDetalleVista.tsx` una nota *«Orden asignada a <Nombre> · solo lectura»* cuando un mecánico abre la orden de otro compañero.
     - En `ServicioSheet.tsx`, mostrar `"Repuesto · $..."` en los repuestos, advertir o deshabilitar «Enviar para aprobación» si la orden tiene `0` ítems cotizados, corregir el mensaje `"Los hallazgos deben tener al menos 10 caracteres"`, y evitar las consultas `N+1` al construir la sección «Actividad».
  2. En `PanelTaller.tsx` (`/admin`):
     - Enlazar las lecturas superiores con `/admin/ordenes?grupo=...`.
     - Resaltar en color de peligro (`text-danger-text`) las tarjetas de bahía cuyas órdenes están atrasadas y mostrar un acceso directo a `/admin/inventario?critico=true` cuando hay repuestos en stock crítico.
     - En «Entregadas recientemente», mostrar `#<numero>`, placa, moto y fecha corta de entrega; y ocultar el `Fab` `+ Nueva orden` en escritorio (`lg:`) donde ya existe «Recibir moto» en la barra superior.

**Criterios de aceptación**
- **Dado** el mecánico en `/mecanico`, **cuando** toca una lectura como «En reparación» o «Listas», **entonces** navega a `/mecanico/ordenes` con ese filtro activo, y «Mi cola de trabajo» no muestra órdenes ya marcadas como `lista_entrega`.
- **Dado** un mecánico que abre el detalle de una orden asignada a otro mecánico, **cuando** se muestra la pantalla, **entonces** ve el aviso indicando quién la tiene asignada y que está en solo lectura.
- **Dado** el administrador en `/admin`, **cuando** hay órdenes atrasadas o entregas recientes de una misma moto, **entonces** las bahías atrasadas resaltan en rojo y cada fila de «Entregadas recientemente» identifica su número `#orden`.

---

### HU-86 · Autogestión de perfil, cambio de contraseña y restablecimiento asistido por el taller

**Historia:** Como **usuario (cliente, mecánico o admin)**, quiero ver y editar mis datos personales, cambiar mi contraseña y que el administrador pueda restablecer la clave de un mecánico o cliente sin costo, para no quedar bloqueado ni con datos desactualizados.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-86` | Obligatoria | 3 | HU-18, HU-22, HU-73 |

**Casos de uso**
- *Principal:*
  1. **Backend (`auth`, `usuarios`, `clientes`):**
     - `PATCH /api/auth/perfil` (`requireAuth`): actualiza `nombre`, `telefono` y `email` del usuario autenticado (validando correo único y sincronizando la ficha `Cliente` cuando aplique).
     - `PATCH /api/auth/password` (`requireAuth`): verifica `passwordActual`, guarda el hash de `passwordNueva` (`bcryptjs` costo 12) y revoca los `refreshToken` previos.
     - `POST /api/usuarios/:id/reset-password` y `POST /api/clientes/:id/reset-password` (`requireRole('admin')`): genera una clave temporal alfanumérica de 8 caracteres para ese usuario del taller, actualiza su `passwordHash`, revoca sus sesiones y devuelve la clave temporal para que el admin la entregue por WhatsApp (`wa.me`) o en persona.
  2. **Frontend (`PerfilPage.tsx`, `DatosTallerForm.tsx`, `EquipoPage.tsx`, `ClienteDetallePage.tsx`):**
     - Separar la pantalla «Mi cuenta» (`/admin/perfil`, `/mecanico/perfil`, `/cliente/perfil`) del menú móvil «Más» (`/admin/mas`), y hacer que al guardar en `/admin/taller` regrese a la vista anterior en escritorio.
     - Mostrar en «Mi cuenta» para los 3 roles: nombre, correo, celular, rol y taller (tanto en móvil como en escritorio), junto con las hojas **«Editar mis datos»** y **«Cambiar contraseña»**.
     - En `/admin/equipo` y `/admin/clientes/:id` (para clientes con cuenta), agregar **«Restablecer contraseña»** con confirmación y botones para enviar por WhatsApp o copiar la clave temporal.

**Criterios de aceptación**
- **Dado** cualquier usuario autenticado en «Mi cuenta», **cuando** actualiza su nombre, teléfono o correo, **entonces** los cambios se guardan en base de datos y se reflejan de inmediato en la sesión activa.
- **Dado** un usuario en «Cambiar contraseña», **cuando** ingresa una contraseña actual incorrecta, **entonces** recibe error `400`; y cuando ingresa la correcta, se actualiza su clave y las sesiones anteriores se revocan.
- **Dado** un mecánico o cliente con cuenta que olvidó su contraseña, **cuando** el admin ejecuta «Restablecer contraseña», **entonces** obtiene una clave temporal funcional para que el usuario vuelva a ingresar.

---

### HU-87 · Gestión completa de inventario, motos, clientes y equipo (editar, ajustar con motivo e inactivar)

**Historia:** Como **administrador o cliente**, quiero poder editar o desactivar un repuesto, escribir cantidades y motivos en movimientos de stock, corregir el rol de un integrante y eliminar una moto creada por error sin órdenes, para mantener los datos del taller limpios y exactos.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-87` | Obligatoria | 3 | HU-25, HU-26, HU-52, HU-54 |

**Casos de uso**
- *Principal:*
  1. **Inventario (`RepuestoSheet.tsx` y `QuantityStepper.tsx`):**
     - Mostrar precio de venta, referencia/SKU, proveedor y motos compatibles en la hoja del repuesto (y costo/margen para el admin).
     - Agregar en `RepuestoSheet` el botón **«Editar repuesto»** (solo admin) conectado a `PATCH /api/repuestos/:id`, incluyendo la opción de desactivar el repuesto (`activo: false`).
     - Permitir escribir el número directamente en `QuantityStepper`, agregar el campo opcional «Referencia o motivo» al registrar un movimiento y explicar en «Ajuste» que el valor ingresado será el nuevo stock total.
  2. **Motos (`MotoSheet.tsx` y `motos` en backend):**
     - Bloquear la edición del campo `placa` cuando la moto tiene una orden activa.
     - Agregar `DELETE /api/motos/:id` (admin o cliente dueño): elimina la moto si no tiene órdenes ni citas registradas; si ya tiene historial, responde `409` con mensaje claro.
     - Mostrar en `/admin/clientes/:id` si una moto tiene una orden activa.
  3. **Equipo (`EquipoPage.tsx` y `usuarios` en backend):**
     - Permitir al `admin` editar nombre, teléfono y rol (`mecanico` <-> `admin`) de un usuario del taller, impidiendo dejar al taller sin al menos un administrador activo (`400`).

**Criterios de aceptación**
- **Dado** un repuesto en `/admin/inventario`, **cuando** el admin edita su precio, stock mínimo o estado activo, **entonces** se actualiza mediante `PATCH /api/repuestos/:id` y refresca la lista.
- **Dado** una moto sin órdenes ni citas asociadas, **cuando** su dueño o el admin la elimina tras confirmar, **entonces** desaparece de la lista; pero si tiene órdenes asociadas, responde `409`.
- **Dado** una moto con una orden abierta, **cuando** se abre «Editar moto», **entonces** la placa no se puede modificar.

---

### HU-88 · Ítems adicionales en una orden aprobada o en reparación (Ampliación de cotización)

**Historia:** Como **mecánico o administrador**, quiero poder agregar un repuesto o servicio adicional cuando descubro un daño nuevo durante la reparación y pedir la aprobación del cliente, para no tener que cancelar la orden entera y crear otra desde cero.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-88` | Obligatoria | 3 | HU-33, HU-34, HU-56 |

**Casos de uso**
- *Principal:*
  1. En `backend/src/modules/ordenes/`:
     - Permitir agregar ítems (`POST /api/ordenes/:id/servicios`) cuando la orden está en `aprobada`, `en_reparacion` o `pendiente_repuesto`.
     - Al agregar un ítem en cualquiera de esos tres estados, recalcular `costoTotal`, pasar la orden a `esperando_aprobacion`, registrar en `HistorialOrden` *«Ítem adicional agregado a la cotización (<nombre>). Esperando aprobación del nuevo total»* y crear un `Aviso` para el cliente dueño (`HU-69`).
     - Cuando el cliente o el admin aprueba el nuevo total y la orden vuelve a `en_reparacion`, `sincronizarStockOrden` descuenta **solo la diferencia pendiente** respecto a las salidas ya registradas para esa orden, evitando duplicar descuentos previos.
     - Permitir también al `admin` iniciar o avanzar la reparación en `estados.ts` cuando el mecánico asignado no pueda hacerlo.
  2. En `frontend/src/features/ordenes/`:
     - En la pestaña `Servicios` de `OrdenDetalleVista.tsx`, mostrar **«Agregar ítem adicional»** con un aviso claro indicando que la orden volverá a pedir aprobación del cliente por el nuevo monto.

**Criterios de aceptación**
- **Dado** una orden en `en_reparacion` con un repuesto ya descontado, **cuando** el mecánico o admin agrega un repuesto adicional, **entonces** la orden pasa a `esperando_aprobacion` con el nuevo total y queda registrado en el historial.
- **Dado** esa orden con ítem adicional aprobada de nuevo, **cuando** vuelve a `en_reparacion`, **entonces** solo se descuenta del inventario el repuesto nuevo sin duplicar la salida del repuesto anterior.

---

### HU-89 · Reseñas y calificación del servicio al entregar o cerrar la orden

**Historia:** Como **cliente**, quiero calificar el servicio recibido y dejar una reseña cuando me entregan mi moto, y como **administrador**, quiero revisar y responder esas reseñas para adaptar mejoras continuas en el taller.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-89` | Obligatoria | 3 | HU-36, HU-49 |

**Casos de uso**
- *Principal:*
  1. **Esquema y migración (`resenas_orden`):**
     - Tabla `ResenaOrden` (`resenaOrdenId` Int PK, `publicId` UUIDv7 único, `tallerId` FK, `ordenServicioId` FK único, `clienteId` FK, `calificacion` Int `1..5`, `aspectos` VarChar(255) opcional, `comentario` VarChar(500) opcional, `estado` `pendiente | revisada | adaptada`, `respuestaAdmin` VarChar(500) opcional, `creadoEn`, `actualizadoEn`).
     - `seed.ts` crea reseñas de ejemplo sobre órdenes entregadas/cerradas.
  2. **API:**
     - `POST /api/ordenes/:id/resena` (`requireRole('cliente')`): permite al cliente dueño de una orden en `entregada` o `cerrada` guardar su calificación (`1..5`), aspectos destacados y comentario, creando un `Aviso` para los administradores del taller.
     - `GET /api/resenas?calificacion=&estado=&page=` (`requireRole('admin')`): devuelve las reseñas del taller junto con `meta.promedio` y `meta.pendientes`.
     - `PATCH /api/resenas/:id` (`requireRole('admin')`): permite al administrador registrar `respuestaAdmin` y marcar la reseña como `revisada` o `adaptada`.
  3. **Frontend:**
     - En `SeguimientoCliente.tsx`, cuando la orden está en `entregada` o `cerrada`, mostrar la tarjeta **«Califica tu experiencia»** (1 a 5 estrellas, aspectos rápidos y comentario); una vez enviada, muestra la reseña y la respuesta del taller.
     - Pantalla `/admin/resenas` (enlazada desde `/admin/mas`, encabezado y resumen en `/admin`): muestra el promedio de satisfacción, filtros por estrellas y estado (`Por revisar`, `Adaptadas`) y hoja para responder y marcar como mejora adaptada.

**Criterios de aceptación**
- **Dado** una orden en `entregada` o `cerrada`, **cuando** el cliente dueño envía su reseña de 1 a 5 estrellas, **entonces** queda guardada, se refleja en su seguimiento y no permite crear una segunda reseña para la misma orden (`409`).
- **Dado** una orden aún abierta (`registrada`, `en_reparacion`, etc.), **cuando** se intenta registrar una reseña, **entonces** responde `409`.
- **Dado** el administrador en `/admin/resenas`, **cuando** responde una reseña y la marca como `adaptada`, **entonces** el cliente ve la respuesta del taller en el detalle de su orden.

---

### HU-90 · Seguimiento público sin cuenta y comprobante de servicio imprimible

**Historia:** Como **cliente sin cuenta en la app**, quiero abrir el enlace compartido por WhatsApp para ver el resumen de mi orden, y como **cliente o admin**, quiero imprimir o guardar en PDF el comprobante del servicio realizado.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-90` | Deseable | 2 | HU-31, HU-68 |

**Casos de uso**
- *Principal:*
  1. `GET /api/ordenes/seguimiento/:publicId` (público): devuelve únicamente los datos de seguimiento de la orden (número, estado, paso, placa, marca y referencia, nombre/teléfono/dirección/horario del taller, fecha estimada, hallazgos, ítems cotizados y total), sin datos personales del cliente ni `codigoRetiro`.
  2. Ruta pública `/s/:id`: muestra el seguimiento en solo lectura con botón para escribir por WhatsApp al taller o iniciar sesión/crear cuenta; `mensajeCotizacionWhatsApp` y `mensajeOrdenWhatsApp` incluyen el enlace `/s/<publicId>`.
  3. Botón **«Imprimir comprobante»** en `OrdenDetalleVista.tsx` y `SeguimientoCliente.tsx` con diseño de impresión (`@media print`) que incluye datos del taller, vehículo, diagnóstico, repuestos/servicios y total.

**Criterios de aceptación**
- **Dado** un cliente sin sesión que abre `/s/:publicId`, **cuando** carga la página, **entonces** ve el estado y la cotización de su moto sin que la API exponga teléfono, documento ni `codigoRetiro`.
- **Dado** el detalle de una orden, **cuando** se pulsa «Imprimir comprobante», **entonces** la vista de impresión oculta la navegación y muestra el formato de recibo completo del taller.

---

### HU-91 · Soporte multi-taller para cuentas de cliente

**Historia:** Como **cliente motociclista**, quiero poder consultar mis motos y órdenes si llevo mi moto a más de un taller que use MotoTrack con mi mismo correo, para no tener que crear cuentas con correos distintos.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 13 | `HU-91` | Deseable | 2 | HU-14, HU-27 |

**Casos de uso**
- *Principal:*
  1. Permitir que un usuario con `rol === 'cliente'` vincule fichas `Cliente` de distintos talleres que coincidan con su correo o documento de identidad (desde el registro o desde «Mi cuenta» → «Vincular otro taller»).
  2. Permitir alternar el taller activo en `/cliente` y `/cliente/perfil` (o listar todas sus motos y órdenes identificando a qué taller pertenece cada una).

**Criterios de aceptación**
- **Dado** un cliente con cuenta en un taller que registra o vincula un segundo taller con su mismo documento, **cuando** entra a su portal, **entonces** puede cambiar entre sus talleres y ver las motos y órdenes de cada uno.
