# Diseño de MotoTrack

Guía visual de la app. Cada pantalla debe ser **idéntica** a su pantalla del prototipo: mismo orden, textos, tamaños, componentes y animaciones. Solo se omite lo que la app todavía no tiene datos o funciones para mostrar (fecha estimada de entrega, citas, inventario, IA, WhatsApp, modo oscuro); nunca se inventan datos.

- **Prototipo navegable (referencia principal):** https://claude.ai/artifact/M2oVJGvZ6oAqGJKattY41w
- **Copia en el repositorio:** `docs/prototipo/mototrack-prototipo.html`. Se abre con doble clic en el navegador (necesita internet para cargar React y las fuentes). Si el prototipo cambia, se reemplaza esta copia en el mismo PR.
- **Aprobado el 17 de octubre de 2026.** Reemplaza el diseño anterior (azul marino y cian, Montserrat e Inter).

---

## 1. La idea

Fondo blanco único al estilo Apple, tinta casi negra y **un solo color de acento: el amarillo de la placa**. La personalidad la ponen la fuente de la placa (Michroma) en números y montos, los arcos de progreso y el botón de «mantener presionado».

**Reglas que no se rompen:**

1. **Un solo fondo:** blanco. Las zonas se separan con superficies grises suaves, no con sombras ni con colores.
2. **Un solo acento:** amarillo `#F5C400`. No hay naranja ni cian. El amarillo marca lo que necesita atención o lo que está activo.
3. **El rojo es solo para peligro:** cancelar, rechazar, errores, falta de repuesto.
4. **El verde es solo para el chip de «hecho»**. Nunca va en botones.
5. **Los botones principales son tinta** (casi negro) con texto blanco.

---

## 2. Colores

Los colores **solo** se definen en `frontend/src/styles/index.css`. `npm run check:tokens` falla si un componente usa otro.

| Token | Valor | Uso |
|---|---|---|
| `bg` / `surface` | `#FFFFFF` | Fondo de toda la app y de las tarjetas |
| `surface-sunken` | `#F5F5F7` | Bloques grises: tarjetas de bahía, lecturas, campos |
| `surface-2` | `#ECEDF0` | Gris un poco más fuerte: *hover*, barras vacías |
| `ink` | `#16191D` | Texto principal, botón principal, navegación |
| `ink-muted` | `#6B7280` | Texto secundario |
| `border` / `border-strong` | `#E3E5E8` / `#8E959E` | Líneas y bordes (el fuerte en campos) |
| `on-primary` | `#FFFFFF` | Texto sobre el botón principal (tinta) |
| `accent` / `plate` | `#F5C400` | Acento y placa. Texto encima en `ink` |
| `accent-text` | `#7A5900` | Texto amarillo sobre blanco (el amarillo puro no se lee) |
| `accent-soft` | `#FFF5CC` | Fondo amarillo suave para avisos |
| `danger` / `danger-text` / `danger-soft` | `#D94A3D` / `#B7382C` / `#FCEBE9` | Peligro, errores |
| `success` / `success-text` / `success-soft` | `#2F8F5B` / `#1F7146` / `#E6F3EB` | Solo chips de «hecho» |

> **Modo oscuro:** el prototipo lo tiene, pero la app todavía no. Se hará en una HU futura con los valores oscuros del prototipo (`docs/prototipo`, bloque `[data-theme="dark"]`).

---

## 3. Fuentes

| Fuente | Dónde se usa | Paquete |
|---|---|---|
| **Geist** 400, 500 y 600 | Todo el texto: títulos, botones, campos | `@fontsource/geist` |
| **Michroma** 400 | Marca, placas, números grandes, montos (`$ 85.000`), número de orden | `@fontsource/michroma` |

- Las fuentes se cargan en local con `@fontsource`. No se usa Google Fonts.
- Clases: `font-sans` (Geist) y `font-num` (Michroma).
- Michroma **nunca** va en párrafos ni en botones, solo en números, placas y marca.
- Títulos en Geist 600 con letras un poco más juntas (`tracking-tight`). Sin mayúsculas sostenidas en etiquetas.
- Base de 16 px. Los números grandes (dial, montos) van de 22 a 70 px.

---

## 4. Forma, espacios y medidas

| Elemento | Valor |
|---|---|
| Radios | 12 px (`rounded-sm`), 22 px (`rounded-md`), 28 px (`rounded-lg`), píldora (`rounded-full`) |
| Toque mínimo | 48 px (`min-h-touch`) |
| Sombras | Casi no hay. Solo en hojas, menús y tarjetas elevadas: `0 24px 48px -20px` en tinta al 35 % |
| Ancho de formularios en computador | **760 px como máximo.** El botón de guardar mide lo mismo que el formulario, no todo el ancho de la pantalla |
| Ancho máximo del contenido | 1200 px |

---

## 5. Animaciones

Pocas y con intención. Responden a lo que hace la persona.

| Curva | Valor | Para qué |
|---|---|---|
| `ease-out` | `cubic-bezier(.23, 1, .32, 1)` | Entradas, botones, menús |
| `ease-in-out` | `cubic-bezier(.77, 0, .175, 1)` | Arcos y barras que avanzan |
| `drawer` | `cubic-bezier(.32, .72, 0, 1)` | Hojas inferiores que suben |

- **Botones:** al presionarlos se encogen a `scale(.97)`.
- **Hover:** solo en pantallas con mouse: `@media (hover: hover) and (pointer: fine)`. En el celular no hay *hover*.
- **Reducir movimiento:** si el sistema lo pide (`prefers-reduced-motion`), se quitan los desplazamientos y desenfoques; los cambios de contenido quedan como un fundido simple. Lo que responde al dedo (el relleno de mantener presionado) se marca con `data-movimiento="esencial"` y sigue animándose. Ya está en `index.css`.
- **Animaciones de texto de la landing:** con [Motion](https://motion.dev) (`motion/react`), al estilo de React Bits (BlurText y RotatingText), en `features/landing/components/efectos.tsx`.
- **Librerías:** primero CSS. Si una animación lo necesita de verdad, se puede usar Motion o un componente gratis de React Bits, avisando al equipo. **Nada de pago** sin aprobación.

---

## 6. Componentes

Viven en `frontend/src/components/ui`. Cada uno se ve en `/dev/ui`.

| Componente | Cómo se ve |
|---|---|
| `Button` | Principal: tinta con texto blanco. Secundario: gris `surface-sunken`. Peligro: rojo. Fantasma: solo texto. Radio píldora |
| `HoldButton` *(nuevo)* | Botón de **mantener presionado**. Ver la sección 7 |
| `Plate` | Placa amarilla con borde tinta y letras en Michroma |
| `Card` | Fondo `surface-sunken`, radio 22 px, sin sombra |
| `StatusBadge` | Chip píldora con punto de color: amarillo si espera algo (aprobación o repuesto), verde si está lista o entregada, tinta si está cerrada, rojo si está cancelada, gris en el resto |
| `Arc` / `Dial` *(nuevos)* | Arco de progreso de 6 pasos (Recibida → Diagnóstico → Aprobada → En reparación → Lista → Entregada). El dial grande va en el detalle de la orden |
| `Tabs` | Segmentado: píldora gris con la opción activa en blanco |
| `BottomSheet` | Esquinas de 28 px; sube con la curva `drawer`. En computador se ve como diálogo |
| `Input`, `Select`, `Textarea` | Fondo blanco, borde fuerte, radio 12 px, etiqueta arriba y error abajo en rojo. Al enfocar, borde y contorno en tinta |
| `TopNav` *(nuevo, computador)* | Barra superior de vidrio: marca, pestañas segmentadas, botón principal y menú del avatar (perfil, cerrar sesión) |
| `BottomNav` | Barra inferior en el celular con las opciones del rol |
| `Logo` | Cuadro tinta redondeado con un arco blanco de velocímetro y aguja amarilla |

---

## 7. El botón de mantener presionado

Se usa para **cambiar el estado de una orden**, porque es una acción que no se deshace fácil. Evita tocarlo sin querer sin tener que abrir una ventana de confirmación.

- La persona **mantiene presionado**. El botón se llena de izquierda a derecha en **1,2 s**.
- Cuando se llena, dice **«Suelta para …»**. Al **soltar**, se hace la acción.
- Si suelta antes, el relleno se devuelve en 200 ms y no pasa nada.
- Con teclado: mantener Enter o Espacio hace lo mismo.
- Con «reducir movimiento» activo, el relleno se sigue llenando: es la respuesta a lo que hace la persona.

**Cuándo va directo y cuándo con hoja:**

| Acción | Cómo se confirma |
|---|---|
| Enviar para aprobación, Iniciar reparación, Lista para entregar, Reanudar, Entregar moto, Cerrar orden | **Directo:** mantener presionado en el detalle de la orden |
| Aprobar (cliente o admin) | **Directo:** «Mantén para aprobar $ 85.000». El total ya se ve grande arriba |
| Rechazar, Falta repuesto, Cancelar orden | **Con hoja:** primero se abre la hoja para escribir el motivo o el repuesto (es obligatorio). El botón de confirmar de la hoja es de mantener presionado |

No cambia ninguna regla del negocio: se llama la misma API con el mismo estado y la misma observación.

---

## 8. Pantallas: qué parte del prototipo corresponde a cada ruta

**Regla:** se migran las pantallas que ya existen en el repositorio y la landing. Lo demás del prototipo (citas, inventario, IA, suscripción, notificaciones, modo oscuro) es la dirección de las próximas HU y se construye cuando llegue su historia.

| Ruta en la app | Pantalla del prototipo | Notas |
|---|---|---|
| `/` | Landing | Igual a la landing aprobada |
| `/login` | Panel «Iniciar sesión» sobre la landing | «Soy del taller / Soy cliente», con correo y contraseña |
| `/registro`, `/registro/taller`, `/registro/cliente` | Paneles «Crear cuenta», «Registrar taller» y «Cuenta de cliente» | Sin código por WhatsApp (segunda entrega) |
| `/admin` (Inicio) | Panel del taller | Lecturas, bahías, «Equipo hoy» y «Entregadas recientemente» con las órdenes reales. «Lo que pasó hoy» y la sugerencia de IA quedan para después |
| `/admin/ordenes`, `/mecanico` | Órdenes | Pestañas segmentadas y buscador |
| `/admin/ordenes/nueva` | Recibir moto | Formulario de 760 px en computador |
| `/<rol>/ordenes/:id` | Detalle de la orden | Dial de 6 pasos y botones de mantener presionado |
| `/admin/clientes`, `/admin/clientes/:id` | Clientes, Cliente | — |
| `/admin/equipo` | Usuarios | — |
| `/cliente` | Mis motos | — |
| `/cliente/ordenes` y su detalle | Seguimiento | Isla oscura con 6 segmentos, monto grande y «Mantén para aprobar / rechazar» |
| `/<rol>/perfil` | Mi cuenta | — |
| 404 y error | — | Mismo estilo: fondo blanco, título Geist, botón tinta |

---

## 9. Antes de entregar una pantalla

- [ ] Es idéntica a su pantalla del prototipo en 390 px y en 1440 px (puestas lado a lado).
- [ ] Solo usa tokens (`npm run check:tokens` pasa) y componentes de `ui`.
- [ ] No hay desplazamiento horizontal en 360, 390 y 1440 px.
- [ ] Toques de 48 px como mínimo, foco visible y etiqueta en cada campo.
- [ ] Respeta «reducir movimiento».
- [ ] No cambió reglas del negocio, la API ni la base de datos.
