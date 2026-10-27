---

description: "Task list for Sudoku aleatorio táctil"
---

# Tasks: Sudoku aleatorio táctil

**Input**: Design documents from `/specs/001-sudoku-tactil/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS. La constitución (principio III) exige
pruebas escritas antes de implementar el dominio, y SHOULD para los flujos táctiles. En cada
fase, las tareas de prueba van primero y MUST fallar antes de implementar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Proyecto único de frontal en `frontend/` (ver plan.md › Project Structure). Sin `backend/`.
- Código: `frontend/src/`. Pruebas: `frontend/tests/{unit,component,sample,e2e}/`.
- Referencias: [data-model.md](./data-model.md), [contracts/domain-api.md](./contracts/domain-api.md),
  [contracts/storage-schema.md](./contracts/storage-schema.md), [contracts/ui-contract.md](./contracts/ui-contract.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Crear el proyecto Vite + React 19 + TypeScript en `frontend/` (`npm create vite@latest frontend -- --template react-ts`), borrar los archivos de demo (`src/App.css`, `src/assets/`, contenido de `src/App.tsx` e `src/index.css`) y crear las carpetas vacías del plan: `frontend/src/{domain,workers,state,components/dialogs,i18n,styles}` y `frontend/tests/{unit,component,sample,e2e}`
- [X] T002 Instalar dependencias de desarrollo en `frontend/package.json`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`, `@axe-core/playwright`, `prettier`, `eslint-plugin-react-hooks`, `typescript-eslint`; y definir los scripts `dev`, `build`, `preview`, `typecheck` (`tsc --noEmit -p .`), `lint`, `test` (`vitest run --dir tests --exclude tests/sample/** --exclude tests/e2e/**`), `test:sample` (`vitest run tests/sample`), `test:e2e` (`playwright test`)
- [X] T003 [P] Activar en `frontend/tsconfig.json` (y `tsconfig.app.json` si Vite lo genera) `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`, e incluir `tests/` en la compilación de tipos
- [X] T004 [P] *(Implementado con oxlint, que trae la plantilla de Vite; ver research R10)* Configurar ESLint plano con `typescript-eslint` y `eslint-plugin-react-hooks` en `frontend/eslint.config.js`, y Prettier (`printWidth: 100`, `singleQuote: true`) en `frontend/.prettierrc`
- [X] T005 [P] Configurar Vitest en `frontend/vite.config.ts` (`test.environment: 'node'` por defecto y `setupFiles: ['tests/setup.ts']`; **no** usar `environmentMatchGlobs`, obsoleto desde Vitest 3: cada archivo de `tests/component/` empieza con el comentario `// @vitest-environment jsdom`) y crear `frontend/tests/setup.ts` que importe `@testing-library/jest-dom/vitest` solo cuando exista `document` (`if (typeof document !== 'undefined')`)
- [X] T006 [P] Configurar Playwright en `frontend/playwright.config.ts`: `testDir: 'tests/e2e'`; dos `webServer`: `npm run dev -- --port 5173` (desarrollo) y `npm run build && npm run preview -- --port 4173` (build de producción); cuatro proyectos: `Pixel 7` (Chromium), `iPhone 13` (WebKit) y `mobile-360` (Chromium, `viewport: { width: 360, height: 640 }`, `hasTouch: true`, `isMobile: true`) contra `http://localhost:5173` con `testIgnore: /privacy\.spec\.ts/`, y `build-360` (mismo dispositivo que `mobile-360`) contra `http://localhost:4173` con `testMatch: /(privacy|layout)\.spec\.ts/`
- [X] T007 [P] Añadir a `.gitignore` de la raíz: `frontend/playwright-report/`, `frontend/test-results/`, `frontend/blob-report/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dominio puro (tipos, aleatoriedad, reglas, resolvedor, generador), worker de
generación, acceso seguro a almacenamiento, textos y estilos base. Todo lo que necesita
cualquier historia.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational (write first, MUST fail)

- [X] T008 [P] Pruebas de `createRng` y `randomSeed` en `frontend/tests/unit/rng.test.ts`: misma semilla → misma secuencia de 100 valores; valores en `[0, 1)`; semillas distintas → secuencias distintas; `randomSeed()` devuelve un entero de 32 bits sin signo
- [X] T009 [P] Pruebas de reglas en `frontend/tests/unit/rules.test.ts`: `peers(i)` devuelve exactamente 20 índices únicos, sin incluir `i`, que comparten fila, columna o caja (probar `0`, `40`, `80`); `findConflicts` detecta repeticiones en fila, en columna y en caja, ignora las celdas con `0` y devuelve vacío para una solución válida completa
- [X] T010 [P] Pruebas del resolvedor en `frontend/tests/unit/solver.test.ts`: `countSolutions(g, 2)` devuelve `1` para un puzle conocido de solución única, `2` para un tablero casi vacío, `0` para un tablero con conflicto, y nunca supera `limit`; `solve` devuelve la solución conocida del puzle y `null` para un tablero imposible; no muta la entrada
- [X] T011 [P] Pruebas del generador en `frontend/tests/unit/generator.test.ts`, con 20 semillas fijas por nivel: `countSolutions(result.givens, 2) === 1`; `solve(result.givens)` igual a `result.solution`; cada pista coincide con `solution`; nº de pistas **siempre** dentro de `CLUE_RANGES` ("easy 36-45, medium 30-35, hard 24-29"), sin excepciones; misma `(difficulty, seed)` → resultado idéntico; `result.seed` y `result.difficulty` coinciden con la entrada
- [X] T012 [P] Pruebas del almacenamiento seguro en `frontend/tests/unit/storage.test.ts` (con un `localStorage` simulado): `readJson` devuelve `null` si la clave no existe, si el JSON es inválido o si `getItem` lanza; `writeJson` no lanza si `setItem` lanza (cuota/modo privado)

### Implementation for Foundational

- [X] T013 Definir los tipos del dominio en `frontend/src/domain/types.ts` exactamente como en data-model.md: `Digit` (`1 | … | 9`), `CellIndex` (`0..80`), `Grid` ("array de 81 `Digit | 0`", `0` = vacía, orden por filas), `NoteMask` (`0..511`, "bit `d-1` activo = nota `d` presente"), `Difficulty` (`'easy' | 'medium' | 'hard'`), `Sudoku` (`givens`, `solution`, `difficulty`, `seed`), `Move` (`kind: 'set' | 'erase' | 'toggleNote'`, `cell`, `digit: Digit | null`, `before: { cell; value: Digit | 0; notes: NoteMask }[]`), `Game` (`puzzle`, `values`, `notes`, `selected`, `notesMode`, `history`, `status: 'playing' | 'won'`, `elapsedMs`, `runningSince`, `startedAt`) y `GameAction` de contracts/domain-api.md; más helpers `rowOf`, `colOf`, `boxOf` (`caja = floor(fila/3)*3 + floor(columna/3)`)
- [X] T014 [P] Implementar `createRng(seed)` (mulberry32) y `randomSeed()` (`crypto.getRandomValues` sobre `Uint32Array(1)`) en `frontend/src/domain/rng.ts` hasta que pase T008
- [X] T015 [P] Implementar `peers` (precalculado una vez para las 81 celdas) y `findConflicts` en `frontend/src/domain/rules.ts` hasta que pase T009
- [X] T016 Implementar `countSolutions(grid, limit)` y `solve(grid)` en `frontend/src/domain/solver.ts` con backtracking, máscaras de bits de 9 bits por fila/columna/caja y heurística MRV (elegir la celda vacía con menos candidatos); devolver `0` de inmediato si la entrada tiene conflictos; parar al alcanzar `limit`; trabajar sobre una copia. Hasta que pase T010
- [X] T017 Implementar `CLUE_RANGES` y `generateSudoku(difficulty, seed)` en `frontend/src/domain/generator.ts` según research R3: (1) solución completa por backtracking con orden de candidatos barajado con `createRng(seed)`; (2) objetivo de pistas al azar dentro del rango del nivel; (3) recorrer las 81 celdas en orden aleatorio quitando cada pista y restaurándola si `countSolutions(…, 2) !== 1`, parando al llegar al objetivo; (4) si al terminar el recorrido quedan más pistas que el máximo del rango, reintentar con una nueva solución (misma `rng`) hasta quedar dentro del rango; nunca devolver un puzle fuera de rango; tope de seguridad de 200 intentos, tras el cual lanza `Error('generation-exhausted')`. Hasta que pase T011
- [X] T018 Crear `frontend/src/domain/index.ts` que reexporte la API pública de contracts/domain-api.md (tipos, `createRng`, `randomSeed`, `peers`, `findConflicts`, `countSolutions`, `solve`, `CLUE_RANGES`, `generateSudoku`)
- [X] T019 Crear la prueba de muestra en `frontend/tests/sample/generator.sample.test.ts`: para cada nivel, generar 1.000 puzles con semillas `1..1000`; afirmar que el 100 % tiene solución única (SC-002); afirmar que el 100 % queda dentro de `CLUE_RANGES`; mostrar con `console.table` el número medio de intentos, el tiempo medio y el p95 por nivel; afirmar `p95 * 4 < 1000 ms` (aproximación de móvil de gama media, SC-003). Timeout de la prueba: 10 minutos
- [X] T020 Implementar el worker en `frontend/src/workers/generator.worker.ts` según contracts/domain-api.md › Protocolo: recibe `GenerateRequest { id, difficulty, seed }`, llama a `generateSudoku`, responde `{ id, ok: true, sudoku, durationMs }` o `{ id, ok: false, error }` si lanza
- [X] T021 Implementar `usePuzzleSource()` en `frontend/src/state/usePuzzleSource.ts`: crea el worker con `new Worker(new URL('../workers/generator.worker.ts', import.meta.url), { type: 'module' })`; expone `request(difficulty): Promise<Sudoku>` que usa un puzle pregenerado del mismo nivel si existe y, si no, lo pide al worker; tras cada entrega pregenera el siguiente del mismo nivel; ignora respuestas con `id` obsoleto; si el worker no existe, genera de forma síncrona con `generateSudoku` como respaldo; si responde `ok: false` (por ejemplo `generation-exhausted`), reintenta una vez con una semilla nueva antes de recurrir al respaldo síncrono (también con semilla nueva). Si la URL tiene `?seed=N` (entero), el **primer** puzle usa esa semilla (necesario para las pruebas e2e deterministas)
- [X] T022 [P] Implementar `readJson<T>(key)` y `writeJson(key, value)` en `frontend/src/state/storage.ts` con todo acceso a `localStorage` dentro de `try/catch`, y las constantes `GAME_KEY = 'sudokus-web:v1:game'` y `PREFS_KEY = 'sudokus-web:v1:prefs'`. Hasta que pase T012
- [X] T023 [P] Crear `frontend/src/i18n/es.ts` con todos los textos de contracts/ui-contract.md: nombres de nivel ("Fácil", "Medio", "Difícil"), botones ("Borrar", "Notas", "Deshacer", "Nueva partida", "Cancelar", "Empezar nueva", "Seguir jugando"), títulos de diálogo ("Nueva partida", "¡Resuelto!"), texto de confirmación ("¿Empezar una partida nueva? Se perderá la actual."), "Tablero de sudoku", "Números", "Generando…", y funciones para los nombres accesibles de celda ("Fila F, columna C, valor V" / "vacía" / "pista V" / "notas 1, 4" / sufijo "en conflicto")
- [X] T024 [P] Crear `frontend/src/styles/tokens.css` con variables en `:root` para colores (fondo, texto, pista, valor del jugador/acento, selección, relacionadas, mismo dígito, conflicto) con contraste WCAG AA, redefinidas en `@media (prefers-color-scheme: dark)`, y tamaños (`--key-min: 44px`, `--cell-min: 36px`, `--gap`); y `frontend/src/styles/app.css` con base: `body` con fondo explícito, `touch-action: manipulation`, `user-select: none`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none`, alto `100dvh` sin scroll, y `@media (prefers-reduced-motion: reduce)` que anule transiciones
- [X] T025 Ajustar `frontend/index.html`: `lang="es"`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="color-scheme" content="light dark">`, título "Sudoku"; e importar `styles/tokens.css` y `styles/app.css` en `frontend/src/main.tsx`

**Checkpoint**: `npm test` en verde para T008-T012; `npm run test:sample` en verde; el dominio
genera puzles válidos fuera del hilo principal.

---

## Phase 3: User Story 1 - Jugar un sudoku nuevo hasta resolverlo (Priority: P1) 🎯 MVP

**Goal**: abrir la web y resolver un sudoku Medio solo con toques: seleccionar celda + número,
borrar, ver conflictos, cronómetro, victoria y nueva partida con confirmación.

**Independent Test**: en un móvil (o `mobile-360`), completar un sudoku solo con toques y ver
"¡Resuelto!" con el tiempo; "Nueva partida" da otro sudoku distinto.

### Tests for User Story 1 (write first, MUST fail)

- [X] T026 [P] [US1] Pruebas del reducer en `frontend/tests/unit/game.test.ts`: `newGame` deja `values = givens`, `notes` a `0`, `history` vacío, `status: 'playing'`, `runningSince = now`; `select` cambia `selected` (también sobre pistas); `input` sin selección o sobre una pista no cambia nada; `input` en celda editable pone el valor, registra un `Move { kind: 'set', before }` y no registra nada si el valor ya era el mismo; `erase` vacía la celda y registra `Move`, sin registrar si ya estaba vacía; `derive().conflicts` marca ambas celdas de una repetición; `derive().digitCounts` cuenta cada dígito; completar la solución pasa `status` a `'won'`, para el cronómetro (`runningSince = null`, `elapsedMs` acumulado) y a partir de ahí `input`/`erase` no hacen nada; tablero lleno con conflictos no pasa a `'won'`; `pause`/`resume`/`tick` acumulan `elapsedMs` correctamente; el reducer no muta el estado de entrada
- [X] T027 [P] [US1] Pruebas de componentes en `frontend/tests/component/board.test.tsx`: el tablero tiene `role="grid"` con nombre "Tablero de sudoku" y 81 botones de celda; los nombres accesibles siguen ui-contract ("pista V", "vacía", "valor V", sufijo "en conflicto"); tocar una pista y luego un número no la cambia; tocar celda vacía + "5" muestra "valor 5"; la tecla de un dígito colocado 9 veces tiene `aria-disabled="true"`; no existe ningún `<input>` ni `<textarea>` en el DOM
- [X] T028 [P] [US1] Prueba e2e en `frontend/tests/e2e/play.spec.ts` con `?seed=12345`: obtener la solución en el test con `generateSudoku('medium', 12345)` importado de `../../src/domain`; el tablero aparece en < 1 s; tocar celda vacía + número muestra el valor; un número repetido marca conflicto; rellenar todas las celdas con la solución muestra el diálogo "¡Resuelto!" con el tiempo; "Nueva partida" con progreso pide confirmación y "Empezar nueva" carga un tablero distinto

### Implementation for User Story 1

- [X] T029 [US1] Implementar `newGame`, `gameReducer` (acciones `select`, `input` en modo normal, `erase`, `tick`, `pause`, `resume`; `undo` y `toggleNotesMode` como no-op por ahora) y `derive` (`conflicts`, `digitCounts`, `isComplete` = "no hay `0` en `values` y `conflicts` está vacío", `hasProgress` = "`history.length > 0`") en `frontend/src/domain/game.ts` siguiendo data-model.md › Reglas de validación; exportarlos desde `frontend/src/domain/index.ts`. Hasta que pase T026
- [X] T030 [US1] Implementar `GameProvider` y `useGame()` en `frontend/src/state/GameProvider.tsx`: `useReducer(gameReducer)`; al montar pide un puzle `'medium'` con `usePuzzleSource` y muestra estado de carga mientras llega; `tick` cada segundo con `setInterval` solo si `status === 'playing'`; `pause` en `visibilitychange` a `hidden` y `resume` a `visible`; expone `startNewGame(difficulty)` y el resultado de `derive`
- [X] T031 [P] [US1] Implementar `Cell` en `frontend/src/components/Cell.tsx`: `<button>` con nombre accesible de `es.ts`, clases para pista (negrita), valor del jugador (acento), seleccionada (fondo fuerte + borde grueso) y conflicto (rojo + subrayado ondulado); `onClick` despacha `select`; tamaño mínimo `var(--cell-min)`
- [X] T032 [US1] Implementar `Board` en `frontend/src/components/Board.tsx`: `role="grid"` con nombre "Tablero de sudoku", 9 `role="row"` con 9 `role="gridcell"` que contienen `Cell`; bordes más gruesos entre cajas 3×3; tamaño cuadrado calculado con CSS (`min(100dvw - 16px, alto disponible, 560px)`), es decir, con un máximo de 560 px para que en escritorio mantenga un tamaño cómodo (caso límite "Pantallas grandes") (depende de T031)
- [X] T033 [P] [US1] Implementar `NumberPad` en `frontend/src/components/NumberPad.tsx`: `role="group"` "Números" con botones "1"…"9" de al menos `var(--key-min)`, colocados en vertical en **2 filas (1-5 y 6-9)** y en horizontal en **una cuadrícula 3×3** (9 teclas de 44 px en una fila no caben en 360 px); `onClick` despacha `input`; si `digitCounts[d] === 9`, `aria-disabled="true"`, atenuado y marca ✓; feedback visual en `:active` (< 100 ms)
- [X] T034 [P] [US1] Implementar `StatusBar` en `frontend/src/components/StatusBar.tsx`: nivel de la partida (texto de `es.ts`) y cronómetro `mm:ss` con `role="timer"`, calculado como `elapsedMs + (now - runningSince)`
- [X] T035 [P] [US1] Implementar `ConfirmDialog` y `WinDialog` en `frontend/src/components/dialogs/ConfirmDialog.tsx` y `frontend/src/components/dialogs/WinDialog.tsx`: `role="dialog"`, `aria-modal="true"`, foco al primer botón al abrir, textos y botones de ui-contract › Diálogos ("Empezar nueva" / "Seguir jugando"; "¡Resuelto!" + tiempo + "Nueva partida")
- [X] T036 [US1] Implementar `Toolbar` en `frontend/src/components/Toolbar.tsx` con "Borrar" (despacha `erase`) y "Nueva partida" (si `hasProgress` abre `ConfirmDialog`, si no empieza directamente con `'medium'`); botones de al menos `var(--key-min)`
- [X] T037 [US1] Componer `App` en `frontend/src/App.tsx` y estilos en `frontend/src/styles/app.css`: `GameProvider` → `StatusBar`, `Board`, `Toolbar`, `NumberPad`, `WinDialog` (cuando `status === 'won'`) e indicador "Generando…" mientras no hay puzle; en vertical apilado (`StatusBar` ~40 px, tablero, `Toolbar` en una fila, `NumberPad` en 2 filas) sin scroll desde 360×640; en horizontal (`@media (orientation: landscape)`) el tablero ocupa todo el alto disponible a la izquierda y **`StatusBar`, `Toolbar` y `NumberPad` (3×3) van juntos en una columna a la derecha**, de modo que a 640×360 las celdas sigan midiendo ≥ 36 px (constitución I)

**Checkpoint**: US1 jugable de principio a fin; T026-T028 en verde.

---

## Phase 4: User Story 2 - Ayudas para resolver: notas y deshacer (Priority: P2)

**Goal**: modo notas con candidatos pequeños, borrado automático de notas al colocar un número,
deshacer jugada a jugada y resaltado de fila/columna/caja y mismo dígito.

**Independent Test**: activar "Notas", apuntar 1 y 3 en una celda, poner un 3 definitivo en la
misma fila (la nota 3 desaparece), deshacer dos veces y comprobar cada estado.

### Tests for User Story 2 (write first, MUST fail)

- [X] T038 [P] [US2] Pruebas en `frontend/tests/unit/game-notes-undo.test.ts`: `toggleNotesMode` invierte `notesMode`; `input` en modo notas alterna el bit `d-1` de `notes[i]` solo si `values[i] === 0` y registra `Move { kind: 'toggleNote' }`; poner un número definitivo pone `notes[i] = 0` y quita el bit de ese dígito en los 20 `peers`, guardando en `before` el estado previo de **todas** las celdas modificadas; `erase` vacía valor y notas; `undo` restaura exactamente `before` y quita la última jugada, y con `history` vacío o `status: 'won'` no hace nada; invariante: "`notes` siempre `0` en celdas con pista o con valor"; `derive().highlight.related` contiene fila, columna y caja de `selected` y `highlight.sameDigit` las celdas con el mismo valor
- [X] T039 [P] [US2] Prueba e2e en `frontend/tests/e2e/notes-undo.spec.ts` con `?seed=12345`: activar "Notas" (`aria-pressed="true"`), tocar 1 y 3 en una celda vacía → nombre "notas 1, 3"; poner un 3 definitivo en otra celda de la misma fila → la primera pasa a "notas 1"; "Deshacer" dos veces vuelve al estado previo; "Deshacer" queda `disabled` sin historial

### Implementation for User Story 2

- [X] T040 [US2] Ampliar `gameReducer` en `frontend/src/domain/game.ts` con `toggleNotesMode`, `input` en modo notas, eliminación automática de notas en `peers` al poner un número (FR-011), limpieza de notas en `erase` y `undo` según data-model.md; y añadir `highlight` a `derive`. Hasta que pase T038
- [X] T041 [US2] Mostrar las notas en `frontend/src/components/Cell.tsx` como cuadrícula 3×3 de dígitos pequeños en posición fija, y aplicar las clases de resaltado `related` (fondo tenue) y `sameDigit` (fondo intermedio) desde `derive().highlight`
- [X] T042 [US2] Añadir a `frontend/src/components/Toolbar.tsx` los botones "Notas" (`aria-pressed` según `notesMode`, despacha `toggleNotesMode`) y "Deshacer" (despacha `undo`, `disabled` cuando `history.length === 0` o `status === 'won'`), manteniendo todo sin scroll a 360×640

**Checkpoint**: US1 + US2 funcionan; T038-T039 en verde.

---

## Phase 5: User Story 3 - Elegir la dificultad (Priority: P3)

**Goal**: elegir Fácil, Medio o Difícil al empezar una partida nueva, con el nivel visible y
recordado para la siguiente visita.

**Independent Test**: generar varias partidas en cada nivel y comprobar que el nº de pistas cae
en su rango y que la cabecera muestra el nivel.

### Tests for User Story 3 (write first, MUST fail)

- [X] T043 [P] [US3] Pruebas de preferencias en `frontend/tests/unit/prefs.test.ts`: `loadPrefs()` devuelve `{ lastDifficulty: 'medium' }` si no hay dato, si `schema !== 1` o si `lastDifficulty` no es `'easy' | 'medium' | 'hard'`; `savePrefs` escribe `{ "schema": 1, "lastDifficulty": … }` en `sudokus-web:v1:prefs`
- [X] T044 [P] [US3] Prueba e2e en `frontend/tests/e2e/difficulty.spec.ts`: "Nueva partida" (sin progreso) abre el diálogo con "Fácil", "Medio", "Difícil" y "Cancelar"; para cada nivel, contar las celdas con nombre "pista …" y comprobar el rango (36-45 / 30-35 / 24-29) y que `StatusBar` muestra el nivel; "Cancelar" mantiene la partida; tras elegir "Difícil" y recargar con almacenamiento vacío de partida, la nueva partida es "Difícil"

### Implementation for User Story 3

- [X] T045 [P] [US3] Implementar `loadPrefs()` y `savePrefs(prefs)` en `frontend/src/state/prefs.ts` sobre `readJson`/`writeJson` con `PREFS_KEY` y el formato `StoredPrefs` de contracts/storage-schema.md. Hasta que pase T043
- [X] T046 [P] [US3] Implementar `NewGameDialog` en `frontend/src/components/dialogs/NewGameDialog.tsx`: `role="dialog"`, `aria-modal="true"`, título "Nueva partida", botones "Fácil", "Medio", "Difícil" (un toque, ≥ `var(--key-min)`) y "Cancelar"
- [X] T047 [US3] Integrar el flujo en `frontend/src/components/Toolbar.tsx`, `frontend/src/components/dialogs/WinDialog.tsx` y `frontend/src/state/GameProvider.tsx`: "Nueva partida" → `ConfirmDialog` si `hasProgress` → `NewGameDialog` → `startNewGame(nivel)` + `savePrefs({ lastDifficulty: nivel })`; la primera partida al montar usa `loadPrefs().lastDifficulty` en lugar de `'medium'`; `usePuzzleSource` descarta el pregenerado si el nivel pedido es otro

**Checkpoint**: US1-US3 funcionan; T043-T044 en verde.

---

## Phase 6: User Story 4 - Retomar la partida (Priority: P4)

**Goal**: al recargar o volver a la web, la partida aparece tal como se dejó.

**Independent Test**: hacer jugadas y notas, recargar y comprobar tablero, notas, nivel y tiempo.

### Tests for User Story 4 (write first, MUST fail)

- [X] T048 [P] [US4] Pruebas en `frontend/tests/unit/serialization.test.ts`: `toStored(game)` produce el formato `StoredGame` de contracts/storage-schema.md (grids como cadenas de 81 caracteres, `schema: 1`, sin `selected` ni `runningSince`, con `runningSince` sumado a `elapsedMs`); `fromStored(toStored(g))` reconstruye la partida; `fromStored` devuelve `null` en **cada** caso de storage-schema › Validación al cargar: JSON no objeto, `schema !== 1`, campo ausente, longitud ≠ 81, carácter o entero fuera de rango, `values` distinto de `givens` en una pista, `solution` inválida o distinta de `givens`, `notes[i] !== 0` en celda con pista o valor
- [X] T049 [P] [US4] Prueba e2e en `frontend/tests/e2e/persistence.spec.ts`: hacer jugadas y notas, esperar 500 ms, recargar → mismo tablero, notas, nivel y cronómetro ≥ tiempo anterior; con una partida en `status: 'won'` guardada, al cargar se ofrece "Nueva partida"; con `localStorage['sudokus-web:v1:game'] = '{roto'`, la web arranca con partida nueva sin mostrar error

### Implementation for User Story 4

- [X] T050 [US4] Implementar `toStored(game, now)` y `fromStored(data): Game | null` en `frontend/src/domain/serialization.ts` con todas las validaciones de contracts/storage-schema.md; exportar desde `frontend/src/domain/index.ts`. Hasta que pase T048
- [X] T051 [US4] Persistir en `frontend/src/state/GameProvider.tsx`: al montar, `fromStored(readJson(GAME_KEY))`; si es válida y `status === 'playing'`, restaurarla (con `selected = null` y `resume` si la página está visible) en lugar de generar; guardar con `writeJson(GAME_KEY, toStored(...))` tras cada acción, agrupado a como mucho una escritura cada 300 ms, y forzar el guardado en `visibilitychange` (hidden) y `pagehide`
- [X] T052 [US4] Si la partida restaurada tiene `status === 'won'`, mostrar `WinDialog` con su tiempo y la opción "Nueva partida" en `frontend/src/state/GameProvider.tsx` / `frontend/src/App.tsx` (US4, escenario 2)

**Checkpoint**: las cuatro historias funcionan de forma independiente; T048-T049 en verde.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T053 [P] Pruebas del teclado físico en `frontend/tests/component/keyboard.test.tsx` según ui-contract › Teclado físico: `1`-`9` introducen (o anotan en modo notas), `Delete`/`Backspace`/`0` borran, flechas mueven la selección dentro de 0..80, `n` alterna notas, `Ctrl+Z`/`Meta+Z` deshace
- [X] T054 Implementar `useKeyboard()` en `frontend/src/state/useKeyboard.ts` y usarlo en `frontend/src/App.tsx` (listener en `window` para `keydown`, ignorado mientras hay un diálogo abierto). Hasta que pase T053
- [X] T055 [P] Prueba e2e de layout en `frontend/tests/e2e/layout.spec.ts` (proyectos `mobile-360` y `build-360`), con las mismas comprobaciones **en 360×640 y en 640×360**: `scrollHeight <= innerHeight` y `scrollWidth <= innerWidth`, todas las celdas ≥ 36×36 px y teclas/botones ≥ 44×44 px (`boundingBox`); `getComputedStyle(board).touchAction === 'manipulation'`; en 640×360 `StatusBar`, `Toolbar` y teclado quedan a la derecha del tablero y se conserva la celda seleccionada al girar; con viewport 1280×800 el tablero mide ≤ 560 px de lado; **respuesta al toque** (constitución V, SC-004): medir con `page.evaluate` el tiempo entre `pointerdown` en una celda y el primer `requestAnimationFrame` en que la celda tiene la clase de seleccionada, y entre `pointerdown` en una tecla y el valor visible en la celda; ambos < 100 ms con `cdpSession` `Emulation.setCPUThrottlingRate({ rate: 4 })` en Chromium *(implementado como prueba `@perf` aparte: `npm run test:perf`, sobre el build y con un solo worker, porque en paralelo la contención de CPU falsea la medida)*
- [X] T056 [P] Prueba e2e de accesibilidad en `frontend/tests/e2e/a11y.spec.ts` con `@axe-core/playwright` (reglas `wcag2a`, `wcag2aa`) en esquema claro y oscuro (`page.emulateMedia({ colorScheme })`), con una celda seleccionada y un conflicto visibles
- [X] T057 [P] Prueba e2e de privacidad en `frontend/tests/e2e/privacy.spec.ts` (solo proyecto `build-360`, contra el build de producción para evitar las peticiones del servidor de desarrollo): tras la carga inicial, jugar 10 jugadas y una nueva partida sin ninguna petición de red nueva (`page.on('request')`); `context.cookies()` vacío; en `localStorage` solo claves `sudokus-web:v1:*`; con `context.setOffline(true)` tras cargar, "Nueva partida" sigue generando un puzle (FR-018, FR-019)
- [X] T058 Comprobar el tamaño del bundle: añadir el script `size` en `frontend/package.json` que ejecute `vite build` y falle si el JS total de `frontend/dist/assets/` supera 150 KB gzip (por ejemplo con un pequeño script Node en `frontend/scripts/check-size.mjs` que use `zlib.gzipSync`)
- [X] T059 [P] Crear `README.md` en la raíz con descripción del proyecto, requisitos (Node 24), comandos de `frontend/` (dev, `--host` para móvil, test, test:sample, test:e2e, build) y enlace a `specs/001-sudoku-tactil/`
- [X] T060 Ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:sample`, `npm run test:e2e` y `npm run size` en `frontend/` y corregir cualquier fallo
- [ ] T061 Recorrer los 14 escenarios manuales y la comprobación de privacidad de `specs/001-sudoku-tactil/quickstart.md` en emulación táctil a 360×640 y en un móvil real con `npm run dev -- --host`, anotando cualquier desviación
- [X] T062 [P] Crear `.github/workflows/ci.yml` (constitución III: ningún cambio que rompa pruebas se integra): en `pull_request` hacia `main` y en `push` a `main`, en `ubuntu-latest` con `actions/setup-node` (Node 24, caché de npm en `frontend/package-lock.json`) y `working-directory: frontend`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run size`, `npx playwright install --with-deps chromium webkit` y `npm run test:e2e`; subir `frontend/playwright-report/` como artefacto si falla. `test:sample` en un job aparte solo con `workflow_dispatch` y semanal (`schedule`), por su duración. Después, documentar en `README.md` que hay que proteger `main` exigiendo este check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Se recomienda en orden de prioridad (P1 → P2 → P3 → P4): todas tocan `game.ts`,
    `GameProvider.tsx` o `Toolbar.tsx`, que crea US1
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: solo depende de Foundational. Crea `game.ts`, `GameProvider.tsx`, `Toolbar.tsx`, `Cell.tsx`.
- **US2 (P2)**: amplía `game.ts`, `Cell.tsx` y `Toolbar.tsx` de US1. Se prueba de forma independiente (T038-T039).
- **US3 (P3)**: amplía el flujo "Nueva partida" de US1 (`Toolbar.tsx`, `GameProvider.tsx`). Independiente de US2.
- **US4 (P4)**: amplía `GameProvider.tsx` de US1. Independiente de US2 y US3 (si US2 no está, las notas se guardan igualmente como `0`).

### Within Each Phase

- Las pruebas se escriben primero y MUST fallar antes de implementar (constitución III)
- Tipos (T013) antes que el resto del dominio; `rules` antes que `solver`; `solver` antes que `generator`; `generator` antes que worker y `usePuzzleSource`
- Reducer (`game.ts`) antes que `GameProvider`; componentes hoja (`Cell`, `NumberPad`, `StatusBar`, diálogos) antes que `Board`, `Toolbar` y `App`

### Parallel Opportunities

- Setup: T003, T004, T005, T006, T007 en paralelo tras T001-T002
- Foundational: pruebas T008-T012 en paralelo; luego T014, T015, T022, T023, T024 en paralelo (T016 → T017 → T018-T021 en serie)
- US1: T026-T028 en paralelo; T031, T033, T034, T035 en paralelo tras T029-T030
- US2: T038-T039 en paralelo
- US3: T043-T044 en paralelo; T045 y T046 en paralelo
- US4: T048-T049 en paralelo
- Polish: T053, T055, T056, T057, T059, T062 en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 a la vez (deben fallar):
Task: "Pruebas del reducer en frontend/tests/unit/game.test.ts"
Task: "Pruebas de componentes en frontend/tests/component/board.test.tsx"
Task: "Prueba e2e en frontend/tests/e2e/play.spec.ts"

# Componentes hoja de US1 a la vez (tras T029-T030):
Task: "Implementar Cell en frontend/src/components/Cell.tsx"
Task: "Implementar NumberPad en frontend/src/components/NumberPad.tsx"
Task: "Implementar StatusBar en frontend/src/components/StatusBar.tsx"
Task: "Implementar ConfirmDialog y WinDialog en frontend/src/components/dialogs/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: escenarios 1-5, 12 y 13 de quickstart.md en `mobile-360` y en un móvil real
5. Demo en local (`npm run dev -- --host`); la publicación queda fuera de alcance

### Incremental Delivery

1. Setup + Foundational → dominio probado y generador validado con 1.000 puzles
2. US1 → juego completo jugable (MVP)
3. US2 → notas y deshacer
4. US3 → niveles de dificultad
5. US4 → partida persistente
6. Polish → teclado físico, layout, accesibilidad, privacidad, tamaño, README

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Phase 8: Convergence

- [ ] T063 Ejecutar `frontend/tests/e2e/layout.spec.ts` también en los proyectos `iPhone 13` (WebKit) y `Pixel 7` quitando `layout` de su `testIgnore` en `frontend/playwright.config.ts` (mantener `privacy` excluido), y corregir en `frontend/src/styles/app.css` cualquier fallo de sin scroll, celdas ≥ 36 px, teclas ≥ 44 px o disposición horizontal en WebKit; la prueba `@perf` sigue solo en `build-360` per plan: T006 / T055, Constitución › Restricciones técnicas (partial)
- [ ] T064 Hacer inerte la tecla de un dígito colocado 9 veces: en `frontend/src/components/NumberPad.tsx` no despachar `input` si `digitCounts[d] >= 9` (mantener `aria-disabled="true"` y la marca ✓), y en `frontend/src/state/useKeyboard.ts` ignorar igualmente ese dígito; añadir el caso a `frontend/tests/component/board.test.tsx` (tocar la tecla completa no cambia la celda seleccionada) per FR-016 (partial)
- [ ] T065 En `frontend/src/state/GameProvider.tsx`, capturar el rechazo de `source.request(pending)` y reintentar con `generateSudoku(pending, randomSeed())` hasta 3 veces sin mostrar error técnico, de modo que "Generando…" nunca quede bloqueado; cubrirlo con una prueba en `frontend/tests/component/` que simule una fuente que rechaza la primera petición per research R4 / contracts/domain-api › Protocolo (partial)
