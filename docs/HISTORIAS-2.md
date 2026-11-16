# MotoTrack · Historias de usuario de la segunda etapa (HU-51 a HU-81)

> Lo que falta según `contexto.md` (sección 3, «Segunda entrega o después») y el prototipo aprobado el 17-oct (`docs/prototipo/mototrack-prototipo.html`).
> Sigue el mismo formato que `docs/HISTORIAS.md`. Reparto del trabajo: `docs/REPARTO.md`.
> Última actualización: sábado 24 de octubre de 2026.

---

## Cómo leer este documento

Igual que `docs/HISTORIAS.md`: historia, ficha, casos de uso y criterios *Dado / Cuando / Entonces*. Una historia solo se cierra cuando cumple **todos** sus criterios y la *Definición de terminado* (`CLAUDE.md`, sección 6).

**Orden de las etapas:**

1. **E8 a E11** (sin costo): se hacen primero, en paralelo entre las 3 personas.
2. **E12 · Funciones con costo:** **no se empiezan** hasta que el equipo apruebe el gasto o la cuenta (regla de `CLAUDE.md`). Si se aprueban, van antes de E7.
3. **E7 · Despliegue y entrega (HU-38 a HU-40):** queda **de última**, sin cambios, como está en `docs/HISTORIAS.md`.

**Criterios comunes a todas las historias con pantalla.** Además de los propios, cada una cumple:
- **Dado** la pantalla, **cuando** se pone al lado de su pantalla del prototipo en 390 px y 1440 px, **entonces** es idéntica: orden, textos, tamaños, componentes y animaciones. Lo que no tiene datos se omite; no se inventa.
- **Dado** el código, **cuando** se corre `npm run check:tokens`, **entonces** pasa.
- **Dado** 360, 390 y 1440 px, **cuando** se recorre la pantalla, **entonces** no hay desplazamiento horizontal y los toques miden al menos 48 px.
- **Dado** «reducir movimiento» activo, **cuando** se usa la pantalla, **entonces** no hay animaciones y todo sigue funcionando.

**Criterios comunes a todas las historias con backend:**
- Toda consulta filtra por `tallerId`; un recurso de otro taller responde **404**.
- Hacia afuera solo `publicId` (UUIDv7); nunca los `Int`.
- Cada texto tiene `.max()` en Zod igual al largo de la columna, en backend y frontend.
- Pruebas contra MySQL real con Supertest, sin mocks de Prisma.

---

## Resumen

| ID | Historia | Etapa | Prioridad | Pts | Pantalla del prototipo |
|---|---|---|---|---|---|
| **E8 · Inventario de repuestos** ||||||
| HU-51 | Tablas de repuestos y movimientos | 8 | Obligatoria | 3 | — |
| HU-52 | API de repuestos y stock crítico | 8 | Obligatoria | 3 | — |
| HU-53 | Registrar entradas, salidas y ajustes de stock | 8 | Obligatoria | 2 | Inventario (hoja del repuesto) |
| HU-54 | Pantalla de inventario | 8 | Obligatoria | 3 | Inventario |
| HU-55 | Registrar un repuesto nuevo | 8 | Obligatoria | 2 | Repuesto nuevo |
| HU-56 | Repuestos en la cotización del diagnóstico | 8 | Obligatoria | 3 | Diagnóstico |
| **E9 · Citas y agenda** ||||||
| HU-57 | Tabla y API de citas | 9 | Obligatoria | 3 | — |
| HU-58 | Agenda de citas del taller | 9 | Obligatoria | 3 | Citas |
| HU-59 | Pedir una cita como cliente | 9 | Obligatoria | 3 | Pedir cita, Cita agendada |
| HU-60 | Ver, reprogramar y cancelar mis citas | 9 | Obligatoria | 2 | Mis citas |
| **E10 · El día a día del taller** ||||||
| HU-61 | Ficha de la moto con su historial | 10 | Obligatoria | 2 | Moto |
| HU-62 | Fecha estimada de entrega y aviso de atraso | 10 | Obligatoria | 2 | Detalle de la orden |
| HU-63 | Reasignar el mecánico de una orden | 10 | Deseable | 1 | Detalle de la orden (Más acciones) |
| HU-64 | Inicio del mecánico | 10 | Obligatoria | 3 | Inicio (mecánico) |
| HU-65 | Inicio del cliente | 10 | Obligatoria | 2 | Portal del cliente |
| HU-66 | Código de retiro para entregar la moto | 10 | Obligatoria | 2 | Seguimiento (tarjeta de retiro) |
| HU-67 | Invitar usuarios al taller con un código | 10 | Obligatoria | 3 | Invitar usuario, Unirse con invitación |
| HU-68 | Contactar al cliente por WhatsApp sin costo | 10 | Deseable | 1 | Detalle de la orden, Alertas |
| **E11 · Avisos, reportes y ajustes** ||||||
| HU-69 | Avisos automáticos al cambiar el estado | 11 | Obligatoria | 3 | — |
| HU-70 | Pantalla de avisos | 11 | Obligatoria | 2 | Avisos |
| HU-71 | Reportes del taller | 11 | Obligatoria | 3 | Reportes |
| HU-72 | Exportar el reporte a Excel | 11 | Deseable | 1 | Reportes |
| HU-73 | Menú «Más» y datos del taller | 11 | Obligatoria | 2 | Más |
| HU-74 | Tema oscuro | 11 | Deseable | 2 | Más, Mi cuenta |
| HU-75 | Recordatorios de mantenimiento (por reglas, sin IA) | 11 | Obligatoria | 3 | Alertas |
| **E12 · Funciones con costo (solo con aprobación)** ||||||
| HU-76 | Recuperar la contraseña con un código | 12 | Con costo | 3 | Recuperar contraseña, Código, Contraseña nueva |
| HU-77 | Verificar el celular con un código | 12 | Con costo | 3 | Código |
| HU-78 | Fotos en el diagnóstico | 12 | Con costo | 2 | Diagnóstico, Detalle |
| HU-79 | Asistente IA de diagnóstico | 12 | Con costo | 5 | Asistente IA |
| HU-80 | Plan del taller y facturas | 12 | Con costo | 3 | Taller y suscripción |
| HU-81 | Pagar con tarjeta, PSE o Nequi | 12 | Con costo | 5 | Pago |

**Total sin costo (E8 a E11):** 25 historias, 59 puntos (unos 20 por persona).
**Con costo (E12):** 6 historias, 21 puntos, solo si se aprueban.
**Después:** E7 (HU-38 a HU-40, 6 puntos), como está en `docs/HISTORIAS.md`.

**Fuera de estas historias:** el «Plan Inteligente» con predicciones de IA reales (HU-75 lo deja con reglas fijas) y el envío automático por WhatsApp (HU-68 usa enlaces `wa.me`, que no cuestan).

---

## E8 · Inventario de repuestos

### HU-51 · Tablas de repuestos y movimientos

**Historia:** Como **equipo**, quiero guardar los repuestos del taller y cada movimiento de stock, para saber qué hay y por qué cambió.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-51` | Obligatoria | 3 | HU-06 |

**Casos de uso**
- *Principal:*
  1. En `schema.prisma` se agregan `Repuesto` (`publicId`, `tallerId`, nombre, referencia, categoría, precio de venta, costo, stock, stock mínimo, proveedor, motos compatibles, activo) y `MovimientoStock` (`publicId`, repuesto, tipo `entrada | salida | ajuste`, cantidad, stock resultante, referencia, orden opcional, usuario, fecha).
  2. Categorías del prototipo: Aceites, Frenos, Filtros, Transmisión, Eléctrico, Llantas, Otros.
  3. `npm run db:migrate -- --name inventario`.
  4. El seed agrega los repuestos de ejemplo del prototipo (Aceite Motul 20W-50 1L, Pastillas freno del. Pulsar, Kit de arrastre FZ 2.0…), algunos en stock crítico.

**Criterios de aceptación**
- **Dado** el esquema nuevo, **cuando** se corre `npm run db:deploy` en una base limpia, **entonces** se crean las dos tablas con `tallerId` e índices.
- **Dado** el seed, **cuando** se corre, **entonces** hay al menos 6 repuestos y 2 de ellos con stock menor o igual al mínimo.
- **Dado** el dinero, **cuando** se revisa el esquema, **entonces** precio y costo son `Int` en pesos.

---

### HU-52 · API de repuestos y stock crítico

**Historia:** Como **admin**, quiero crear, buscar y editar repuestos, para tener el inventario al día.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-52` | Obligatoria | 3 | HU-51 |

**Casos de uso**
- *Principal:* módulo `backend/src/modules/repuestos/`:
  - `GET /api/repuestos?q=&categoria=&critico=&page=`: admin y mecánico.
  - `GET /api/repuestos/:id`: con sus últimos 20 movimientos.
  - `POST /api/repuestos` y `PATCH /api/repuestos/:id`: solo admin. El stock inicial crea un movimiento `entrada`.
- *Alterno, nombre repetido en el taller:* 409.

**Criterios de aceptación**
- **Dado** `critico=true`, **cuando** se lista, **entonces** solo salen los repuestos con `stock <= stockMinimo`.
- **Dado** un mecánico, **cuando** intenta crear o editar, **entonces** responde 403.
- **Dado** un repuesto de otro taller, **cuando** se pide, **entonces** responde 404.
- **Dado** la respuesta, **cuando** se revisa, **entonces** trae `margen` calculado por el backend `(precio − costo) / precio`.

---

### HU-53 · Registrar entradas, salidas y ajustes de stock

**Historia:** Como **admin**, quiero registrar lo que entra, sale o se corrige del inventario, para que el stock sea real.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-53` | Obligatoria | 2 | HU-52 |

**Casos de uso**
- *Principal:* `POST /api/repuestos/:id/movimientos` con `{ tipo, cantidad, referencia? }`. Entrada suma, salida resta, ajuste deja el stock en el valor dado. Todo en una transacción.
- *Alterno, salida mayor que el stock:* 409 «No hay suficientes unidades».

**Criterios de aceptación**
- **Dado** una entrada de 24, **cuando** se registra, **entonces** el stock sube 24 y el movimiento guarda el stock resultante y el usuario.
- **Dado** una salida mayor al stock, **cuando** se intenta, **entonces** responde 409 y no cambia nada.
- **Dado** dos salidas al mismo tiempo, **cuando** terminan, **entonces** el stock nunca queda negativo.

---

### HU-54 · Pantalla de inventario

**Historia:** Como **admin**, quiero ver mis repuestos y cuáles están en stock crítico, para pedir a tiempo.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-54` | Obligatoria | 3 | HU-53, HU-73 |

**Casos de uso**
- *Principal:*
  1. Ruta `/admin/inventario` (en celular, dentro de «Más»; en computador, en la barra).
  2. Título «Inventario» con «N repuestos · M en stock crítico», buscador «Buscar repuesto» y filtros «Todos», «Stock crítico» y categorías.
  3. Cada fila (`StockRow`): nombre, categoría y precio, stock con barra; en crítico, ícono de alerta.
  4. Al tocar una fila se abre la hoja: «En stock», «Stock mínimo», «Sugerido pedir N unidades» si está crítico, segmentado Entrada / Salida / Ajuste, cantidad y «Últimos movimientos».
  5. El mecánico ve la lista y la hoja en solo lectura.
- *Alterno, sin resultados:* `EmptyState` «Sin resultados».

**Criterios de aceptación**
- **Dado** un repuesto crítico, **cuando** se ve la lista, **entonces** se marca con el acento y el aviso «Stock crítico».
- **Dado** una salida mayor al stock, **cuando** se elige, **entonces** el botón queda deshabilitado.
- **Dado** un movimiento guardado, **cuando** se cierra la hoja, **entonces** la lista y el contador se actualizan sin recargar.

---

### HU-55 · Registrar un repuesto nuevo

**Historia:** Como **admin**, quiero agregar un repuesto con su precio, costo y stock, para empezar a controlarlo.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-55` | Obligatoria | 2 | HU-54 |

**Casos de uso**
- *Principal:* ruta `/admin/inventario/nuevo`, pantalla «Repuesto nuevo»: nombre, referencia, categoría, precio de venta, costo (muestra «Margen: N %»), stock inicial, stock mínimo, proveedor y motos compatibles. Botón «Guardar repuesto».
- *Alterno, margen menor al 15 %:* el margen se muestra en color de advertencia, pero se puede guardar.
- La foto del repuesto se omite (va con HU-78).

**Criterios de aceptación**
- **Dado** los datos completos, **cuando** se guarda, **entonces** aparece en el inventario con su movimiento de entrada inicial.
- **Dado** un costo mayor al precio, **cuando** se escribe, **entonces** el margen sale negativo en rojo.
- **Dado** el formulario en computador, **cuando** se ve en 1280 px, **entonces** mide 760 px y el botón de guardar mide lo mismo.

---

### HU-56 · Repuestos en la cotización del diagnóstico

**Historia:** Como **mecánico**, quiero agregar repuestos del inventario a la cotización, para que el cliente vea el total real y el stock se descuente.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 8 | `HU-56` | Obligatoria | 3 | HU-53, HU-33 |

**Casos de uso**
- *Principal:*
  1. En el diagnóstico, «Agregar a la cotización» abre «Buscar repuesto o servicio» con el stock de cada repuesto («N en stock», «Bajo», «Agotado»).
  2. La línea de repuesto se guarda en `detalle_servicios` con el repuesto relacionado (migración nueva) y suma al total.
  3. Cuando la orden pasa a `en_reparacion`, se crea una salida por cada repuesto, con la orden como referencia (`OT-<número>`).
- *Alterno, repuesto agotado al iniciar la reparación:* la orden no se bloquea; el mecánico puede pasar a `pendiente_repuesto` con ese repuesto como motivo.
- *Alterno, la orden se cancela después de la salida:* se crea una entrada que devuelve las unidades.

**Criterios de aceptación**
- **Dado** un repuesto en la cotización, **cuando** la orden pasa a `en_reparacion`, **entonces** el stock baja y hay un movimiento con la referencia de la orden.
- **Dado** una orden cancelada con repuestos ya descontados, **cuando** se cancela, **entonces** el stock vuelve al valor anterior.
- **Dado** el total, **cuando** se agrega o quita un repuesto, **entonces** lo recalcula el backend.

---

## E9 · Citas y agenda

### HU-57 · Tabla y API de citas

**Historia:** Como **equipo**, quiero guardar las citas con su estado, para que taller y cliente vean la misma agenda.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 9 | `HU-57` | Obligatoria | 3 | HU-06 |

**Casos de uso**
- *Principal:*
  1. Tabla `Cita` (`publicId`, `tallerId`, moto, cliente, fecha y hora, motivo, detalle, estado `programada | confirmada | atendida | cancelada`, recordatorio sí/no, orden creada opcional, creada por).
  2. Endpoints:
     - `GET /api/citas?desde=&hasta=&estado=`: admin y mecánico ven las del taller; el cliente solo las suyas.
     - `GET /api/citas/horas-libres?fecha=`: horas libres del día.
     - `POST /api/citas`: admin (para cualquier cliente) o cliente (para sus motos).
     - `PATCH /api/citas/:id`: reprogramar o cambiar estado.
  3. Horario: lunes a viernes de 8:00 a 18:00, sábado de 8:00 a 12:00 y domingo cerrado. Se usa `horarioAtencion` del taller si existe.
- *Alterno, hora ocupada:* 409 «Esa hora ya está tomada. Elige otra».

**Criterios de aceptación**
- **Dado** un domingo o una hora fuera del horario, **cuando** se pide una cita, **entonces** responde 400 con un mensaje claro.
- **Dado** un cliente, **cuando** pide una cita para una moto que no es suya, **entonces** responde 404.
- **Dado** una cita `atendida` o `cancelada`, **cuando** se intenta reprogramar, **entonces** responde 409.
- **Dado** el seed, **cuando** se corre, **entonces** hay citas de ejemplo para la semana.

---

### HU-58 · Agenda de citas del taller

**Historia:** Como **admin**, quiero ver las citas por día y recibir la moto cuando llega, para organizar el trabajo.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 9 | `HU-58` | Obligatoria | 3 | HU-57, HU-73 |

**Casos de uso**
- *Principal:*
  1. Ruta `/admin/citas`, pantalla «Citas»: calendario del mes con los días que tienen citas marcados y la lista del día elegido.
  2. Cada cita muestra hora, cliente, placa, motivo y estado (Programada, Confirmada, Atendida).
  3. Botón de llegada: marca la cita `atendida` y abre «Recibir moto» con la moto y el motivo ya puestos.
  4. «Nueva cita» abre la hoja «Agendar»: cliente o placa, motivo, hora y «Recordatorio al cliente».
- *Alterno, día sin citas:* `EmptyState` «Día libre · No hay citas para este día».

**Criterios de aceptación**
- **Dado** una cita que llegó, **cuando** se marca la llegada, **entonces** queda `atendida` y la orden creada queda relacionada con la cita.
- **Dado** una hora ocupada, **cuando** se agenda, **entonces** no aparece como opción.
- **Dado** el mecánico, **cuando** abre la agenda, **entonces** la ve en solo lectura.

---

### HU-59 · Pedir una cita como cliente

**Historia:** Como **cliente**, quiero pedir una cita eligiendo moto, motivo, día y hora, para no tener que llamar al taller.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 9 | `HU-59` | Obligatoria | 3 | HU-57 |

**Casos de uso**
- *Principal:*
  1. Ruta `/cliente/citas/nueva`, pantalla «Pedir cita» en 4 pasos: «1. Moto», «2. Motivo» («Cuéntanos qué necesitas» y «Detalle (opcional)»), «3. Día» (domingos cerrado) y «4. Hora» (solo las libres).
  2. «Recordarme por WhatsApp · Un día antes de la cita» se guarda como preferencia; el envío real queda para E12.
  3. «Resumen» y confirmar. Luego la pantalla «Cita agendada» con «Ver mis citas» y «Volver al inicio».
- *Alterno, sin motos:* «Aún no tienes motos. Agrega una para pedir la cita» con el botón «Agregar otra moto».
- *Alterno, la hora se ocupó mientras elegía:* mensaje del 409 y se recargan las horas libres.
- El texto «Sugerido por el asistente IA» se omite hasta HU-79.

**Criterios de aceptación**
- **Dado** el formulario completo, **cuando** se confirma, **entonces** la cita queda `programada` y aparece en la agenda del taller.
- **Dado** un sábado, **cuando** se eligen horas, **entonces** solo salen de 8:00 a 12:00.

---

### HU-60 · Ver, reprogramar y cancelar mis citas

**Historia:** Como **cliente**, quiero ver mis citas y poder moverlas o cancelarlas, para liberar el horario si no puedo ir.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 9 | `HU-60` | Obligatoria | 2 | HU-59 |

**Casos de uso**
- *Principal:* «Mis citas» (desde «Mi cuenta» y desde el inicio del cliente): próximas y pasadas, con su estado (Programada, Confirmada, Atendida, Cancelada). «Reprogramar cita» reutiliza la pantalla de HU-59.
- *Alterno, cancelar:* confirmación con `HoldButton`; la cita queda `cancelada`.

**Criterios de aceptación**
- **Dado** una cita reprogramada, **cuando** se guarda, **entonces** la hora anterior queda libre.
- **Dado** una cita `atendida`, **cuando** se ve, **entonces** no tiene botones para reprogramar ni cancelar.

---

## E10 · El día a día del taller

### HU-61 · Ficha de la moto con su historial

**Historia:** Como **admin o cliente**, quiero ver la ficha de una moto con todos sus servicios, para saber qué se le ha hecho.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-61` | Obligatoria | 2 | HU-31 |

**Casos de uso**
- *Principal:* pantalla «Moto» (`/admin/motos/:id` y `/cliente/motos/:id`): placa grande, marca, referencia, año, kilometraje y número de servicios; lista de órdenes cerradas con fecha, motivo y total. «Pedir cita» o «Agendar cita» lleva a HU-59 o HU-58.
- Desde el detalle de la orden, «Historial de la moto» abre esta ficha.
- *Alterno, sin servicios:* «Sin servicios todavía · Cuando la moto pase por el taller, su historial aparecerá aquí».
- «Predicción IA» se omite.

**Criterios de aceptación**
- **Dado** una moto con 3 órdenes cerradas, **cuando** se abre la ficha, **entonces** salen las 3, la más reciente primero.
- **Dado** un cliente, **cuando** abre la moto de otro cliente, **entonces** responde 404.

---

### HU-62 · Fecha estimada de entrega y aviso de atraso

**Historia:** Como **admin**, quiero poner una fecha estimada de entrega, para que el cliente sepa cuándo recoger su moto y el taller vea qué va atrasado.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-62` | Obligatoria | 2 | HU-29 |

**Casos de uso**
- *Principal:*
  1. Columna `fechaEstimadaEntrega` en `ordenes_servicio` (migración nueva).
  2. Se pone al recibir la moto o al aprobar la cotización, y se puede cambiar.
  3. El detalle muestra «Entrega» y, si pasó la fecha sin estar lista, el texto en color de peligro. La lista y el seguimiento del cliente también la muestran.

**Criterios de aceptación**
- **Dado** una orden abierta con la fecha vencida, **cuando** se ve, **entonces** se marca como atrasada.
- **Dado** una fecha anterior a la de ingreso, **cuando** se guarda, **entonces** responde 400.

---

### HU-63 · Reasignar el mecánico de una orden

**Historia:** Como **admin**, quiero pasar una orden a otro mecánico, para repartir la carga cuando alguien falta.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-63` | Deseable | 1 | HU-31 |

**Casos de uso**
- *Principal:* en el detalle, «Más acciones» → «Reasignar mecánico» abre una hoja con los mecánicos activos. `PATCH /api/ordenes/:id/mecanico`. Queda una línea en el historial «Reasignado a …».
- *Alterno, orden cerrada o cancelada:* 409.

**Criterios de aceptación**
- **Dado** la reasignación, **cuando** se guarda, **entonces** la orden sale de la lista del mecánico anterior y aparece en la del nuevo.
- **Dado** un mecánico inactivo, **cuando** se intenta asignar, **entonces** responde 400.

---

### HU-64 · Inicio del mecánico

**Historia:** Como **mecánico**, quiero un inicio con mis órdenes y la siguiente acción a la mano, para no buscar qué sigue.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-64` | Obligatoria | 3 | HU-48 |

**Casos de uso**
- *Principal:*
  1. `/mecanico` pasa a ser el inicio del prototipo; la lista actual queda en `/mecanico/ordenes`.
  2. Saludo con el nombre, lecturas «Mis órdenes», «Por diagnosticar», «En reparación», «Sin repuesto» y «Listas».
  3. La orden que más urge arriba, con su `HoldButton` de la siguiente acción («Mantén para iniciar reparación», «Mantén si falta repuesto», «Mantén: llegó el repuesto», «Mantén para marcar lista»…).
  4. «Actividad»: los últimos cambios de estado de sus órdenes.
- *Alterno, sin órdenes:* «Aún no tienes órdenes · Cuando el administrador te asigne una moto, aparecerá aquí».
- «Sugerencia preventiva» se muestra solo cuando exista HU-75.

**Criterios de aceptación**
- **Dado** una orden `aprobada`, **cuando** el mecánico mantiene el botón, **entonces** pasa a `en_reparacion` sin salir del inicio.
- **Dado** el menú del mecánico, **cuando** se revisa, **entonces** tiene Inicio y Órdenes (y «Más» en celular).

---

### HU-65 · Inicio del cliente

**Historia:** Como **cliente**, quiero ver en el inicio mi orden activa, mi próxima cita y mis motos, para saber todo de un vistazo.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-65` | Obligatoria | 2 | HU-59, HU-66 |

**Casos de uso**
- *Principal:* «Portal del cliente» en `/cliente`: saludo, campana de avisos (cuando exista HU-70), orden activa con su botón según el estado («Revisar cotización», «Ver código de retiro», «Ver seguimiento»), «Próxima cita», «Mis motos» con «Agregar mi moto» y la tarjeta «Pide una cita».
- *Alterno, sin órdenes:* «Sin órdenes activas · Cuando dejes tu moto en el taller, verás aquí su estado y la cotización».
- «¿Algo raro en tu moto? Preguntar al asistente» se omite hasta HU-79.

**Criterios de aceptación**
- **Dado** una orden `esperando_aprobacion`, **cuando** el cliente entra, **entonces** el botón principal es «Revisar cotización» y lleva al seguimiento.
- **Dado** una cita programada, **cuando** entra, **entonces** sale en «Próxima cita» con día, hora y moto.

---

### HU-66 · Código de retiro para entregar la moto

**Historia:** Como **admin**, quiero pedir un código al entregar la moto, para asegurarme de que se la llevo a su dueño.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-66` | Obligatoria | 2 | HU-36 |

**Casos de uso**
- *Principal:*
  1. Al pasar a `lista_entrega` el backend crea un código de 4 dígitos (columna nueva en la orden).
  2. El cliente ve la tarjeta «Lista para recoger · Reparación terminada y probada en ruta» con el código.
  3. Para pasar a `entregada`, el admin escribe el código en la hoja de confirmación.
- *Alterno, orden rechazada:* tarjeta «Recoge tu moto · No se hizo ninguna reparación» y «Registrar retiro sin reparación» en el detalle, con el mismo código.
- *Alterno, el cliente no tiene cuenta:* el admin ve el código y puede dárselo por teléfono.

**Criterios de aceptación**
- **Dado** un código errado, **cuando** el admin intenta entregar, **entonces** responde 400 y la orden no cambia.
- **Dado** el cliente dueño, **cuando** abre el seguimiento en `lista_entrega`, **entonces** ve el código; otro usuario no lo recibe en la API.

---

### HU-67 · Invitar usuarios al taller con un código

**Historia:** Como **admin**, quiero invitar a un mecánico o a otro admin con un código, para que cree su propia contraseña.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-67` | Obligatoria | 3 | HU-23 |

**Casos de uso**
- *Principal:*
  1. Tabla `Invitacion` (`publicId`, taller, nombre, celular, correo, rol, código de 4 caracteres, vence a los 7 días, estado `pendiente | usada | cancelada`).
  2. Pantalla «Invitar usuario»: nombre, celular, correo opcional, rol (Mecánico o Administrador con su explicación). «Enviar invitación» muestra el código y un enlace `wa.me` con el mensaje listo (sin costo).
  3. Pantalla pública «Únete a …» en 3 pasos: validar código, datos y contraseña, aceptar términos. Se crea la cuenta con ese rol.
  4. En «Usuarios», las invitaciones pendientes se pueden reenviar o cancelar.
- *Alternos:* «Código no válido», «Invitación vencida», «Esta invitación ya se usó», «Invitación cancelada», con los textos del prototipo.
- La verificación del celular por código queda para HU-77.

**Criterios de aceptación**
- **Dado** un código válido, **cuando** se completa el registro, **entonces** la cuenta queda con el rol de la invitación y la invitación pasa a `usada`.
- **Dado** un código vencido, usado o cancelado, **cuando** se valida, **entonces** sale su mensaje y no se crea nada.
- **Dado** el código, **cuando** se guarda en la base, **entonces** se puede validar, pero nunca se lista completo a otro taller.

---

### HU-68 · Contactar al cliente por WhatsApp sin costo

**Historia:** Como **admin**, quiero abrir WhatsApp con el mensaje ya escrito, para avisar al cliente sin pagar un servicio.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 10 | `HU-68` | Deseable | 1 | HU-31 |

**Casos de uso**
- *Principal:* en el detalle, «Llamar» (`tel:`) y «Escribir por WhatsApp» (`https://wa.me/57…?text=…`). «Compartir cotización» arma el mensaje con hallazgos y total, como en el prototipo. Helper en `lib/` para construir el enlace.
- No se usa la API de WhatsApp (cuesta); el admin envía desde su propio WhatsApp.

**Criterios de aceptación**
- **Dado** un cliente con celular, **cuando** se toca «Escribir por WhatsApp», **entonces** se abre `wa.me` con el número en formato 57XXXXXXXXXX y el texto codificado.
- **Dado** un cliente sin celular, **cuando** se ve el detalle, **entonces** los botones no aparecen.

---

## E11 · Avisos, reportes y ajustes

### HU-69 · Avisos automáticos al cambiar el estado

**Historia:** Como **cliente**, quiero recibir un aviso en la app cada vez que mi orden avanza, para no tener que preguntar.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-69` | Obligatoria | 3 | HU-28 |

**Casos de uso**
- *Principal:*
  1. Tabla `Aviso` (`publicId`, taller, usuario destino, tipo `estado | cotizacion | cita | recordatorio`, título, texto, orden opcional, leído, fecha).
  2. `cambiarEstado()` crea el aviso en la misma transacción, con los textos del prototipo: «Recibimos tu moto.», «Revisa la cotización y apruébala para que empecemos.», «Tu moto está en reparación.», «Estamos esperando un repuesto.», «¡Tu moto está lista! Puedes recogerla.»…
  3. Al taller le llega aviso cuando el cliente aprueba o rechaza.
  4. `GET /api/avisos?noLeidos=`, `PATCH /api/avisos/:id/leido` y `POST /api/avisos/leer-todos`.
- *Alterno, el cliente no tiene cuenta:* no se crea aviso para él.

**Criterios de aceptación**
- **Dado** un cambio de estado, **cuando** se guarda, **entonces** hay un aviso para el cliente dueño, y si el cambio falla no queda aviso.
- **Dado** un usuario, **cuando** lista sus avisos, **entonces** solo ve los suyos.

---

### HU-70 · Pantalla de avisos

**Historia:** Como **usuario**, quiero ver mis avisos y cuáles no he leído, para enterarme de lo importante.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-70` | Obligatoria | 2 | HU-69 |

**Casos de uso**
- *Principal:* campana con contador en la barra superior (cliente y taller) y pantalla «Avisos» con «N sin leer» y filtro «Sin leer». Al tocar un aviso se abre la hoja con el detalle y, si tiene orden, el botón que lleva a ella. Se consulta cada 60 segundos con TanStack Query (sin servicios pagos de notificaciones).
- *Alterno, sin avisos:* `EmptyState`.

**Criterios de aceptación**
- **Dado** un aviso sin leer, **cuando** se abre, **entonces** queda leído y el contador baja.
- **Dado** un aviso de orden, **cuando** se toca su botón, **entonces** abre el detalle de esa orden.

---

### HU-71 · Reportes del taller

**Historia:** Como **admin**, quiero ver ingresos, órdenes cerradas y tiempos, para saber cómo va el taller.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-71` | Obligatoria | 3 | HU-36, HU-73 |

**Casos de uso**
- *Principal:*
  1. `GET /api/reportes?periodo=semana|mes`: ingresos (suma de `costoTotal` de las cerradas), órdenes cerradas, días promedio de ingreso a entrega, comparación con el periodo anterior, órdenes por día y servicios más frecuentes. Solo admin.
  2. Pantalla «Reportes · Indicadores del taller» con el segmentado Semana / Mes, las lecturas (`KpiTile`), «Órdenes por día» y «Servicios más frecuentes».
- «Clientes recuperados por alertas IA» se omite hasta que exista HU-75 con datos.

**Criterios de aceptación**
- **Dado** órdenes cerradas de prueba, **cuando** se pide el mes, **entonces** los totales coinciden con los calculados a mano en la prueba.
- **Dado** un mecánico, **cuando** pide reportes, **entonces** responde 403.
- **Dado** las fechas, **cuando** se agrupan por día, **entonces** se usa la hora de Colombia.

---

### HU-72 · Exportar el reporte a Excel

**Historia:** Como **admin**, quiero descargar el reporte, para guardarlo o enviarlo al contador.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-72` | Deseable | 1 | HU-71 |

**Casos de uso**
- *Principal:* «Exportar a Excel» descarga un `.csv` (se abre en Excel) con las órdenes del periodo: número, fecha de ingreso, entrega, placa, cliente, mecánico y total. Aviso «Reporte exportado a Excel».

**Criterios de aceptación**
- **Dado** el archivo, **cuando** se abre en Excel, **entonces** las tildes se ven bien (UTF-8 con BOM) y los montos son números.

---

### HU-73 · Menú «Más» y datos del taller

**Historia:** Como **admin**, quiero un menú con todo lo del taller y poder editar sus datos, para tenerlo en un solo lugar.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-73` | Obligatoria | 2 | HU-44 |

**Casos de uso**
- *Principal:*
  1. Pantalla «Más» en celular (`/admin/mas`): tarjeta del taller (nombre, dirección, horario), «Clientes y motos», «Inventario» (con críticos), «Citas», «Reportes», «Usuarios y roles» (con pendientes), «Taller y suscripción», «Tema oscuro» y «Cerrar sesión». Cada opción aparece cuando exista su historia.
  2. «Datos del taller»: `PATCH /api/talleres/mio` (solo admin) para nombre, NIT, dirección, teléfono, correo y horario.
  3. En computador, las mismas opciones en la barra superior y el menú del avatar.

**Criterios de aceptación**
- **Dado** el admin, **cuando** cambia el horario, **entonces** las citas nuevas (HU-57) lo usan.
- **Dado** un mecánico, **cuando** intenta editar el taller, **entonces** responde 403.

---

### HU-74 · Tema oscuro

**Historia:** Como **usuario**, quiero activar el tema oscuro, para ver mejor en el taller con poca luz.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-74` | Deseable | 2 | HU-73 |

**Casos de uso**
- *Principal:* interruptor «Tema oscuro · Útil en el taller con poca luz» en «Más» y en «Mi cuenta». Los tokens del tema oscuro se copian del prototipo a `index.css` (y a `TOKENS_BASE`). La preferencia se guarda en `localStorage` (no es un token de sesión, así que la regla de `CLAUDE.md` no aplica).

**Criterios de aceptación**
- **Dado** el tema oscuro, **cuando** se recorren todas las pantallas, **entonces** se ven como en el prototipo y `check:tokens` pasa.
- **Dado** una recarga, **cuando** abre la app, **entonces** conserva el tema elegido sin parpadeo.

---

### HU-75 · Recordatorios de mantenimiento (por reglas, sin IA)

**Historia:** Como **admin**, quiero que la app me sugiera qué motos necesitan mantenimiento, para invitar al cliente a volver.

| Etapa | Rama | Prioridad | Pts | Depende de |
|---|---|---|---|---|
| 11 | `HU-75` | Obligatoria | 3 | HU-61, HU-68, HU-69 |

**Casos de uso**
- *Principal:*
  1. Reglas fijas por servicio (por ejemplo, cambio de aceite cada 3.000 km o 3 meses; pastillas cada 15.000 km), en un archivo de configuración del backend.
  2. `GET /api/recordatorios` calcula qué motos cumplen el intervalo según su última orden cerrada y su kilometraje. Tabla `Recordatorio` con estado `pendiente | aprobado | rechazado` y motivo.
  3. Pantalla «Alertas»: pestañas «Por revisar» e historial; tarjeta con «Por qué:»; «Aprobar y enviar» abre `wa.me` con el mensaje (HU-68) y crea un aviso para el cliente (HU-69); «Rechazar alerta» pide uno de los motivos del prototipo.
  4. La tarjeta «Sugerencia preventiva · N motos cumplen su intervalo esta semana» del inicio usa este conteo.
- El título dice «Recordatorios» en vez de «Alertas IA» mientras no haya IA (diferencia con el prototipo: **preguntar al equipo** antes de elegir el texto).

**Criterios de aceptación**
- **Dado** una moto con el último aceite hace 3.500 km, **cuando** se calculan, **entonces** aparece con «Por qué: último cambio de aceite hace 3.500 km».
- **Dado** un recordatorio rechazado, **cuando** se vuelve a calcular, **entonces** no aparece de nuevo para ese mismo servicio.

---

## E12 · Funciones con costo (solo con aprobación)

> **Ninguna de estas se empieza sin que el equipo apruebe el gasto o la cuenta.** Si un paso pide tarjeta o pago, se detiene y se consulta. Cada historia indica qué servicio necesita.

### HU-76 · Recuperar la contraseña con un código

**Historia:** Como **usuario del taller**, quiero recuperar mi contraseña con un código, para no depender del admin.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-76` | Con costo | 3 | HU-15 | Envío de correo (por ejemplo, plan gratis de un proveedor; crea cuenta) |

**Casos de uso:** «Recupera tu contraseña» en 3 pasos (correo o celular → código de 6 dígitos → «Contraseña nueva» y «Repite la contraseña»), con los textos del prototipo. El código vence a los 10 minutos y se guarda solo su hash. Al cambiar la contraseña se cierran todas las sesiones.

**Criterios de aceptación**
- **Dado** un código errado tres veces, **cuando** se intenta otra vez, **entonces** hay que pedir uno nuevo.
- **Dado** un correo que no existe, **cuando** se pide el código, **entonces** sale el mensaje del prototipo y no se revela nada más.

---

### HU-77 · Verificar el celular con un código

**Historia:** Como **cliente**, quiero verificar mi celular con un código, para que el taller sepa que el número es mío.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-77` | Con costo | 3 | HU-14, HU-67 | SMS o WhatsApp Business (cobra por mensaje) |

**Casos de uso:** pantalla «Código» con 6 casillas, «Verificar», «Reenviar en 0:30», «Enviar por WhatsApp / SMS» y «Cambiar número». Se usa en el registro del cliente y al aceptar una invitación.

**Criterios de aceptación**
- **Dado** el código correcto, **cuando** se verifica, **entonces** el celular queda marcado como verificado.
- **Dado** varios reenvíos seguidos, **cuando** se pide otro antes de 30 segundos, **entonces** se rechaza.

---

### HU-78 · Fotos en el diagnóstico

**Historia:** Como **mecánico**, quiero adjuntar fotos al diagnóstico, para que el cliente vea lo que encontré.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-78` | Con costo | 2 | HU-32, HU-39 | Almacenamiento de archivos (por ejemplo, Vercel Blob; tiene límite gratis) |

**Casos de uso:** «Fotos · Tomar foto» en el diagnóstico (cámara en celular), hasta 4 fotos de máximo 5 MB, comprimidas antes de subir. Se ven en el detalle y en el seguimiento del cliente.

**Criterios de aceptación**
- **Dado** una foto de otro taller, **cuando** se pide su dirección, **entonces** no se puede ver.
- **Dado** un archivo que no es imagen, **cuando** se sube, **entonces** responde 400.

---

### HU-79 · Asistente IA de diagnóstico

**Historia:** Como **cliente o mecánico**, quiero describir un síntoma y recibir posibles causas, para llegar al taller con una idea.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-79` | Con costo | 5 | HU-61 | API de un modelo de IA (cobra por uso) |

**Casos de uso:** pantalla «Asistente IA» tipo chat: saludo, chips de síntomas, respuesta con causas probables y pruebas, y el botón «Pedir cita» con el motivo sugerido (HU-59). La llave de la API vive solo en el backend; límite de mensajes por día por usuario.

**Criterios de aceptación**
- **Dado** el límite diario, **cuando** se supera, **entonces** sale un mensaje claro y no se llama a la API.
- **Dado** la respuesta, **cuando** se muestra, **entonces** dice que es una sugerencia y que el diagnóstico real lo hace el mecánico.

---

### HU-80 · Plan del taller y facturas

**Historia:** Como **admin**, quiero ver mi plan, cambiarlo y descargar mis facturas, para controlar lo que pago.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-80` | Con costo | 3 | HU-73 | Pasarela de pagos (ver HU-81) |

**Casos de uso:** «Taller y suscripción»: plan actual (Básico $ 80.000 o Inteligente $ 130.000 al mes), estado «Activa», «Cambiar plan» con lo que gana o pierde, y lista de facturas con base, IVA (19 %) y total.

**Criterios de aceptación**
- **Dado** un cambio de plan, **cuando** se confirma, **entonces** aplica desde hoy y el ajuste se ve en la próxima factura.

---

### HU-81 · Pagar con tarjeta, PSE o Nequi

**Historia:** Como **admin**, quiero pagar la suscripción en línea, para no hacer transferencias a mano.

| Etapa | Rama | Prioridad | Pts | Depende de | Servicio |
|---|---|---|---|---|---|
| 12 | `HU-81` | Con costo | 5 | HU-80 | Pasarela colombiana (cobra comisión por transacción y pide cuenta empresarial) |

**Casos de uso:** pantalla «Pago» con Tarjeta, PSE y Nequi, validación de tarjeta (Luhn, fecha, CVV), resultado aprobado o rechazado con los mensajes del prototipo, y «Se renueva el 17 de cada mes». Los datos de la tarjeta nunca pasan por nuestro backend: se usa el formulario de la pasarela.

**Criterios de aceptación**
- **Dado** un pago aprobado por la pasarela, **cuando** llega su confirmación al backend, **entonces** se marca la factura como pagada, verificando la firma de la pasarela.
- **Dado** un pago rechazado, **cuando** vuelve a la app, **entonces** se ofrece «Probar con otra tarjeta» o «Usar otro medio de pago».
