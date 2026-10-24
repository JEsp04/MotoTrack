# FLUJO.md · Cómo trabajar en cada sesión

Guía paso a paso para las próximas sesiones de MotoTrack. Resume las reglas de `CLAUDE.md` en el orden en que se usan. Si algo de aquí choca con `CLAUDE.md`, manda `CLAUDE.md`.

Todos los comandos son para **Git Bash en Windows** (no PowerShell).

Última actualización: sábado 24 de octubre de 2026.

---

## 1. Dónde trabajar

- Cada persona trabaja en **su propia copia** del repositorio, en su computador, con `develop` al día (sección 2.1). Todos arrancan desde el mismo commit de `develop`.
- Si en un computador hay dos copias, se usa la más reciente y la otra no se toca.

```bash
cd /ruta/a/tu/copia/MotoTrack   # por ejemplo /c/Users/Paula/IUSH/MotoTrack
```

### Quién lleva qué (detalle en `docs/REPARTO.md`)

| Persona | Tema | Historias | Al final (E7) | Revisa a |
|---|---|---|---|---|
| **A** | Inventario y el día del mecánico | HU-51 a 56, 64 y 68 (20 pts) | HU-38 · Aiven | V |
| **V** | Citas y la experiencia del cliente | HU-57 a 63, 65 y 66 (20 pts) | HU-39 · Vercel | J |
| **J** | Avisos, reportes y ajustes del taller | HU-67 y 69 a 75 (19 pts) | HU-40 · Guion y `v0.1` | A |

J lleva el tema con más integración: conecta `cambiarEstado()` con los avisos (HU-69) y arma la versión final (HU-40).

---

## 2. Al empezar la sesión (5 minutos)

### 2.1 Poner el repositorio al día

```bash
git status                 # que no haya cambios sueltos de otra persona
git checkout develop
git pull origin develop
```

- Si `git status` muestra archivos modificados que no son tuyos: **no tocarlos**, preguntar primero.
- Si solo aparece `package-lock.json` modificado sin razón: `git checkout -- backend/package-lock.json` (o el de `frontend`).

### 2.2 Instalar y preparar la base (solo si cambió algo en `develop`)

```bash
cd backend
npm install
npm run db:deploy          # aplica migraciones nuevas
npm run seed               # datos de ejemplo (borra los que había)
cd ../frontend
npm install
cd ..
```

### 2.3 Pedirle a Claude que lea el contexto

Copiar y pegar al iniciar la sesión con Claude:

> Lee `Memoria.md` y `PROGRESS.md`. Hoy vamos con la **HU-XX**. Lee sus criterios en `docs/HISTORIAS-2.md` (HU-51 a HU-81) o en `docs/HISTORIAS.md` (HU-38 a HU-40) y el reparto en `docs/REPARTO.md`. Si toca pantallas, lee `docs/diseno.md` y abre esa pantalla en `docs/prototipo/` antes de escribir código. No hagas commit ni push sin que te lo pida.

Orden de lectura (`CLAUDE.md`, sección 0):

1. `Memoria.md`: estado y decisiones.
2. `PROGRESS.md`: qué está hecho y qué sigue.
3. `docs/HISTORIAS-2.md` (o `docs/HISTORIAS.md` para E7): criterios de la historia del día.
4. `contexto.md`: solo si hace falta stack, arquitectura o despliegue.
5. `docs/diseno.md` + `docs/prototipo/`: si la historia toca pantallas.

---

## 3. Durante la sesión: una historia a la vez

### 3.1 Crear la rama de la historia

```bash
git checkout develop
git pull origin develop
git checkout -b HU-38      # cambiar por el número de la historia
```

- **Una rama por historia:** `HU-<número>`.
- Si la historia depende de otra que aún no está en `develop`, la rama sale de la rama de esa historia (`git checkout HU-38` y luego `git checkout -b HU-39`).
- Trabajo que no es historia: `fix/…`, `chore/…` o `docs/…`, siempre desde `develop` al día.

### 3.2 Programar

- **Pantallas: idénticas al prototipo.** Mismo orden, textos, tamaños, componentes y animaciones. Lo que la app aún no tiene se omite; no se inventa. Si la pantalla no existe en el prototipo, primero se diseña ahí y se aprueba.
- **Mobile first:** 390 px primero, luego 1280 px.
- Colores solo con los tokens de `frontend/src/styles/index.css`; componentes de `components/ui`.
- Backend: módulo con `routes`, `controller`, `service` y `schemas`; Zod con `.max()`; filtrar por `tallerId`; hacia afuera solo `publicId`.
- Cambios de tablas: editar `schema.prisma` y `npm run db:migrate -- --name descripcion_corta`. Nunca editar una migración ya subida.
- **Cualquier cosa que cueste dinero o cree una cuenta en la nube: preguntar antes.**

### 3.3 Revisar antes de dar la historia por terminada

```bash
cd backend
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
cd ../frontend
npm run check:tokens && npm run lint && npm run typecheck && npm test && npm run build
cd ..
```

Y a mano:

- [ ] Cumple **todos** los criterios de aceptación de `docs/HISTORIAS.md`.
- [ ] Se ve bien en 390 px y 1280 px, sin desplazamiento horizontal.
- [ ] Es idéntica a su pantalla del prototipo.
- [ ] Valida en frontend **y** backend; los permisos están en el backend.
- [ ] Tiene al menos una prueba.

### 3.4 Commit y PR (solo cuando el equipo lo pida)

```bash
git status
git add <archivos de la historia>
git commit -m "feat: descripción corta en español (HU-38)" --author="JEsp04 <Jhojan.espinosaa@comunidad.iush.edu.co>"
git push -u origin HU-38
```

- Prefijos: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Al final, las historias (`HU-38`).
- **Sin** líneas `Co-Authored-By` ni `Claude-Session`.
- En GitHub: abrir el PR y **revisar que la base sea `develop`, no `main`** (GitHub elige `main` por defecto).
- El PR necesita 1 revisión y la revisión automática en verde.
- Nunca `push --force` ni `rebase` de ramas ya subidas sin aprobación.

---

## 4. Al terminar la sesión

1. **`PROGRESS.md`:** marcar `[~]` si quedó en PR, `[x]` solo cuando está unida en `develop`.
2. **`Memoria.md`:** actualizar «Estado actual» y «Sesión activa», y agregar una línea a la bitácora con la fecha.
3. Si se tomó una decisión nueva, agregarla a la tabla «Decisiones vigentes» de `Memoria.md`.
4. `git status` para dejar claro qué quedó sin commit.

---

## 5. Al final: E7 · Despliegue y entrega (6 pts)

**Decisión del 24-oct: E7 queda de última.** Antes van las historias nuevas HU-51 a HU-75 (`docs/HISTORIAS-2.md`), repartidas en 3 rondas entre las 3 personas (`docs/REPARTO.md`). Las de E12 (HU-76 a HU-81) cuestan dinero y solo entran si se aprueban.

Cuando todo eso esté en `develop`, E7 son 3 historias obligatorias, en este orden porque cada una depende de la anterior. En `docs/REPARTO.md` están asignadas: HU-38 a A, HU-39 a V y HU-40 a J.

### A · HU-38 · Base en Aiven (1 pt) · rama `HU-38`

1. **Confirmar con el equipo antes de crear la cuenta** (es un servicio en la nube).
2. Crear cuenta en Aiven con el plan gratuito. Si en algún paso pide tarjeta o pago: **detenerse y consultar**.
3. Crear la base MySQL y copiar la cadena de conexión con `?ssl-mode=REQUIRED`. Guardarla fuera del repositorio (se comparte por fuera, como los `.env`).
4. Aplicar migraciones y datos de ejemplo contra Aiven:

   ```bash
   cd backend
   DATABASE_URL="mysql://...aiven...?ssl-mode=REQUIRED" npm run db:deploy
   DATABASE_URL="mysql://...aiven...?ssl-mode=REQUIRED" npm run seed
   ```

   Ojo: `seed` se niega en producción; correrlo antes de poner `NODE_ENV=production` o pedir a Claude que revise cómo cargar los datos.
5. Verificar en Aiven (o con `npm run db:studio` apuntando a Aiven) que están las 10 tablas.
6. Esta historia casi no tiene código. Si no hay cambios en archivos, se marca en `PROGRESS.md` en la misma rama de HU-39.

**Listo cuando:** las tablas existen en Aiven, no se pagó nada y la cadena no está en el repositorio.

### V · HU-39 · Publicar en Vercel Hobby (3 pts) · rama `HU-39`

1. **Confirmar con el equipo antes de crear la cuenta en Vercel.**
2. Rama desde `develop`: `git checkout -b HU-39`.
3. Pedirle a Claude:
   - `api/index.ts` que exporte la app de Express (sin `app.listen`).
   - `vercel.json`: `/api/*` a la función y todo lo demás a `index.html` (para que `/cliente/motos` no dé 404).
   - Revisar que Prisma use una sola instancia y SSL en la función.
   - Revisar la cookie de renovación para el mismo dominio (`secure` en producción).
4. Probar en local que todo sigue pasando (sección 3.3).
5. Commit, push y PR hacia `develop` (sección 3.4).
6. En Vercel: conectar el repositorio con el plan **Hobby**, cargar las variables (`DATABASE_URL` de Aiven, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN` y `VITE_API_URL` con la dirección publicada).
7. Comprobar en la vista previa del PR:
   - [ ] `/api/health` responde 200.
   - [ ] Iniciar sesión, recargar y la sesión sigue.
   - [ ] Abrir directo `/cliente/motos` carga sin 404.
   - [ ] El plan es Hobby, sin costo.

Si falla el build: revisar los registros de Vercel y corregir en una rama `fix/…`.

### J · HU-40 · Prueba de punta a punta y `v0.1` (2 pts) · rama `HU-40`

J dirige; los tres recorren el guion.

1. Con la app publicada, recorrer el guion en **390 px y 1280 px**:
   1. Se registra un taller y el admin crea un mecánico.
   2. El admin registra un cliente con su moto y abre una orden.
   3. El mecánico diagnostica y la envía para aprobación.
   4. El cliente se registra, ve su moto y aprueba (mantener presionado).
   5. El mecánico repara, marca que falta un repuesto, reanuda y deja la moto lista.
   6. El admin entrega y cierra.
2. Revisar que el historial muestre el registro inicial y los **9 cambios de estado**.
3. Repetir el guion **rechazando** el diagnóstico.
4. En 390 px: sin desplazamiento horizontal ni botones de menos de 48 px.
5. Cada error que aparezca: rama `fix/…`, PR a `develop`, y repetir el guion.
6. En la rama `HU-40`: README con la dirección publicada y las cuentas de prueba, y `PROGRESS.md` / `Memoria.md` al día. PR a `develop`.
7. Cuando `develop` esté estable: PR de `develop` hacia `main` (este es el único PR que va a `main`) y luego la etiqueta:

   ```bash
   git checkout main
   git pull origin main
   git tag v0.1
   git push origin v0.1
   ```

**Listo cuando:** `main` tiene `develop`, existe la etiqueta `v0.1` y el README tiene la dirección y las cuentas.

> Nombre de ramas: `docs/HISTORIAS.md` todavía dice `chore/despliegue` (HU-39) y `release/v0.1` (HU-40). Desde el 17-oct la regla es `HU-<número>`, así que esta guía usa `HU-38`, `HU-39` y `HU-40`. Si el equipo prefiere los nombres viejos, también sirven.

---

## 6. Tareas del equipo que se pueden hacer en cualquier sesión corta

Rama `docs/…` o `chore/…` desde `develop`:

- [ ] Corregir los enlaces a `docs/CONTEXTO.md` en `README.md` y `docs/HISTORIAS.md` (ahora es `contexto.md` en la raíz) y el total «40 historias, 88 puntos» → 50 historias, 112 puntos.
- [ ] Decidir qué pasa con la landing del compañero (la del prototipo ya está en `features/landing`).
- [ ] En GitHub: poner `develop` como rama por defecto y protegerla (1 revisión + revisión automática en verde).
- [ ] Cada integrante actualiza su entorno con `develop` (sección 2).

---

## 7. Resumen en una línea por sesión

| Sesión | Qué | Rama | Antes de empezar |
|---|---|---|---|
| Ronda 1 · A | HU-51 → HU-52 → HU-53 | `HU-<número>` | HU-51 es la primera migración: avisar en el grupo |
| Ronda 1 · V | HU-57 → HU-62 → HU-66 | `HU-<número>` | Migrar después de que se una HU-51 |
| Ronda 1 · J | HU-73 → HU-69 → HU-67 | `HU-<número>` | HU-73 primero: A y V lo necesitan |
| Ronda 2 · A | HU-54 → HU-55 → HU-64 | `HU-<número>` | HU-73 unida |
| Ronda 2 · V | HU-58 → HU-59 → HU-60 | `HU-<número>` | HU-73 unida |
| Ronda 2 · J | HU-70 → HU-71 → HU-72 | `HU-<número>` | Nada |
| Ronda 3 · A | HU-68 → HU-56 | `HU-<número>` | Entregar HU-68 al inicio (J la necesita) |
| Ronda 3 · V | HU-61 → HU-63 → HU-65 | `HU-<número>` | Entregar HU-61 al inicio (J la necesita) |
| Ronda 3 · J | HU-74 → HU-75 | `HU-<número>` | HU-75 espera HU-61 y HU-68 |
| E7 · A | HU-38 · Aiven | `HU-38` | Rondas unidas; confirmar cuenta en la nube |
| E7 · V | HU-39 · Vercel | `HU-39` | HU-38 hecha; confirmar cuenta en la nube |
| E7 · J | HU-40 · Guion y `v0.1` | `HU-40` | HU-39 publicada |
| Corta | Enlaces rotos y GitHub | `docs/…` / `chore/…` | Nada |
