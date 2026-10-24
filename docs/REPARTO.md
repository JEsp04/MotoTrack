# REPARTO.md · División del trabajo entre 3 personas

Reparto de las historias nuevas (`docs/HISTORIAS-2.md`, HU-51 a HU-81) y de E7. **E7 · Despliegue queda de última.**

Los nombres se ponen en la tabla de abajo; el reparto está pensado para que cada persona lleve un tema completo (backend + pantallas) y no se pisen los archivos.

Última actualización: sábado 24 de octubre de 2026.

---

## 1. Quién lleva qué

| Persona | Tema | Historias | Pts |
|---|---|---|---|
| **A** · ______ | Inventario y el día del mecánico | HU-51, 52, 53, 54, 55, 56, 64, 68 | 20 |
| **B** · ______ | Citas y la experiencia del cliente | HU-57, 58, 59, 60, 61, 62, 63, 65, 66 | 20 |
| **C** · ______ | Avisos, reportes y ajustes del taller | HU-67, 69, 70, 71, 72, 73, 74, 75 | 19 |
| **Total** | | 25 historias | **59** |

**Por qué así:**
- Cada tema tiene su propio módulo en `backend/src/modules/` y su carpeta en `frontend/src/features/` (`repuestos`, `citas`, `avisos`, `reportes`…), así que casi no se tocan los mismos archivos.
- Los únicos archivos compartidos son `schema.prisma`, `router/index.tsx`, `router/nav.ts` y `seed.ts`. Ver la sección 3.

---

## 2. Orden de trabajo: 3 rondas y luego E7

Cada ronda termina cuando sus PR están unidos en `develop`. Dentro de cada ronda, una rama por historia (`HU-<número>`).

### Ronda 1 · Tablas y API (lo que los demás necesitan primero)

| Persona | Historias | Pts | Notas |
|---|---|---|---|
| A | HU-51 → HU-52 → HU-53 | 8 | HU-51 es la **primera migración** de la ronda |
| B | HU-57 → HU-62 → HU-66 | 7 | Migraciones después de la de A |
| C | HU-73 → HU-69 → HU-67 | 8 | HU-73 primero: el menú «Más» lo usan inventario, citas y reportes |

### Ronda 2 · Pantallas principales

| Persona | Historias | Pts |
|---|---|---|
| A | HU-54 → HU-55 → HU-64 | 8 |
| B | HU-58 → HU-59 → HU-60 | 8 |
| C | HU-70 → HU-71 → HU-72 | 6 |

### Ronda 3 · Integración entre temas

| Persona | Historias | Pts | Espera a |
|---|---|---|---|
| A | HU-68 → HU-56 | 4 | — |
| B | HU-61 → HU-63 → HU-65 | 5 | — |
| C | HU-74 → HU-75 | 5 | HU-75 espera a HU-61 (B) y HU-68 (A) |

A y B entregan HU-68 y HU-61 **al inicio** de la ronda 3, porque C las necesita.

### E12 · Funciones con costo (solo si se aprueban)

No se asignan todavía. Si el equipo aprueba algún gasto, se reparte así para seguir con el mismo tema:

| Persona | Historias | Pts |
|---|---|---|
| A | HU-78 Fotos, HU-79 Asistente IA | 7 |
| B | HU-80 Plan y facturas, HU-81 Pagos | 8 |
| C | HU-76 Recuperar contraseña, HU-77 Verificar celular | 6 |

### Al final · E7 · Despliegue y entrega (6 pts)

Sin cambios respecto de `docs/HISTORIAS.md`. Se hace con todo lo anterior ya unido en `develop`.

| Persona | Historia | Pts |
|---|---|---|
| A | HU-38 · Base en Aiven (confirmar la cuenta antes) | 1 |
| B | HU-39 · Publicar en Vercel Hobby (confirmar la cuenta antes) | 3 |
| C | HU-40 · Guion de punta a punta y `v0.1` (lo dirige C; los tres recorren el guion) | 2 |

Con las funciones nuevas, el guion de HU-40 debería sumar: pedir una cita, recibir la moto desde la cita, usar un repuesto en la cotización, ver el aviso al cliente y entregar con el código de retiro. **Preguntar al equipo** si se agrega a los criterios de HU-40 antes de cambiarlos.

**Puntos por persona incluyendo E7:** A = 21 · B = 23 · C = 21.

---

## 3. Reglas para no pisarse

1. **Migraciones, una a la vez.** Antes de correr `npm run db:migrate`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout HU-XX
   git merge develop
   cd backend
   npm run db:deploy
   npm run db:migrate -- --name descripcion_corta
   ```

   Avisar en el grupo «voy a crear migración» y unir ese PR pronto. Si dos ramas tocaron `schema.prisma`, la segunda en unirse resuelve el conflicto y vuelve a correr `npm run db:deploy` para comprobar que todo aplica.
2. **Archivos compartidos** (`router/index.tsx`, `router/nav.ts`, `seed.ts`): agregar las líneas nuevas al final de su bloque, sin reordenar lo de otros. Así el conflicto, si sale, es fácil.
3. **Componentes `ui` nuevos** (por ejemplo `KpiTile`, `QuantityStepper`, `Switch`, `Checkbox` del prototipo): quien lo necesite primero lo crea en un PR pequeño propio, y los demás lo reutilizan.
4. **PR siempre hacia `develop`**, revisado por **otra** persona del equipo. Sugerido: A revisa a B, B revisa a C y C revisa a A.
5. **Al terminar cada historia:** marcarla en `PROGRESS.md` y dejar una línea en `Memoria.md` (ver `docs/FLUJO.md`, sección 4).

---

## 4. Dependencias entre personas

| Historia | De | Necesita | De |
|---|---|---|---|
| HU-54 Inventario | A | HU-73 menú «Más» | C |
| HU-58 Agenda | B | HU-73 menú «Más» | C |
| HU-71 Reportes | C | HU-73 (propia) | C |
| HU-65 Inicio del cliente | B | HU-70 campana (opcional) | C |
| HU-64 Inicio del mecánico | A | HU-75 sugerencia (opcional) | C |
| HU-75 Recordatorios | C | HU-61 ficha de la moto, HU-68 WhatsApp | B, A |

Lo «opcional» se muestra solo cuando la otra historia ya esté unida; no bloquea.
