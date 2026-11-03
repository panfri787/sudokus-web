---

description: "Task list for Límite de fallos por partida"
---

# Tasks: Límite de fallos por partida

**Input**: Design documents from `/specs/002-limite-fallos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS. El principio III de la constitución exige escribir las pruebas del
dominio antes de implementarlo, y recomienda (SHOULD) probar los flujos táctiles. En cada fase
las tareas de prueba van primero y MUST fallar antes de implementar.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Proyecto único de frontal en `frontend/`: el código está en `frontend/src/` y las pruebas en
  `frontend/tests/{unit,component,e2e}/`.
- Las rutas de las tareas son relativas a la raíz del repositorio. Los comandos `npm` se
  ejecutan en `frontend/`.
- Referencias:
  - [data-model.md](./data-model.md)
  - [contracts/domain-api.md](./contracts/domain-api.md)
  - [contracts/storage-schema.md](./contracts/storage-schema.md)
  - [contracts/ui-contract.md](./contracts/ui-contract.md)
  - [research.md](./research.md)
- Fixture de dominio: `frontend/tests/unit/fixtures.ts` exporta `SUDOKU`, `PUZZLE`, `SOLUTION`
  y `FIRST_EMPTY`. Un número incorrecto para `FIRST_EMPTY` es cualquier dígito distinto de
  `SOLUTION[FIRST_EMPTY]`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: comprobar que se parte de un estado en verde. No hay dependencias ni estructura
nuevas.

- [X] T001 Ejecutar en `frontend/` `npm run typecheck`, `npm run lint` y `npm test`, y anotar que todo está en verde antes de empezar. Si algo falla, parar e informar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos y valores por defecto que necesitan todas las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T002 En `frontend/src/domain/types.ts`:
  - añadir `export const MAX_MISTAKES = 3`;
  - ampliar `GameStatus` a `'playing' | 'won' | 'lost'`;
  - añadir `readonly mistakes: number` a `Game`, con el comentario `/** 0..MAX_MISTAKES; solo sube dentro de una partida. */`;
  - añadir `| { type: 'retry'; now: number }` a `GameAction`.
- [X] T003 En `frontend/src/domain/game.ts`, hacer que `newGame` devuelva `mistakes: 0`. En `gameReducer`, añadir de momento `case 'retry': return g` para que el `switch` siga siendo exhaustivo.
- [X] T004 En `frontend/src/domain/serialization.ts`:
  - añadir `mistakes: number` a `StoredGame` y ampliar su `status` a `'playing' | 'won' | 'lost'`;
  - hacer que `toStored` escriba `mistakes: game.mistakes`;
  - hacer que `fromStored` devuelva de momento `mistakes: 0`. La validación completa se hace en US3.
- [X] T005 Ejecutar `npm run typecheck` y `npm test` en `frontend/`. Corregir los objetos `Game` literales de las pruebas existentes que no compilen (añadiendo `mistakes: 0`) hasta tenerlo todo en verde.

**Checkpoint**: tipos listos y las pruebas existentes en verde.

---

## Phase 3: User Story 1 - Ver cuántos fallos llevo (Priority: P1) 🎯 MVP

**Goal**: contar como fallo cada número definitivo que no coincide con la solución, mostrar
"Fallos: N/3" y marcar la celda incorrecta.

**Independent Test**: en una partida nueva, introducir un número incorrecto en una celda
vacía. El contador pasa de 0/3 a 1/3 y la celda aparece tachada y con ", incorrecto" en su
nombre accesible. Un número correcto, una nota, borrar o deshacer no cambian el contador.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Crear `frontend/tests/unit/game-mistakes.test.ts` con `SUDOKU` y `FIRST_EMPTY` de `fixtures.ts`. Casos:
  - `newGame(...).mistakes === 0`;
  - seleccionar `FIRST_EMPTY` e `input` del dígito correcto → `mistakes` sigue en 0;
  - `input` de un dígito incorrecto → `mistakes === 1`, `values[FIRST_EMPTY]` es ese dígito y se añade una `Move { kind: 'set' }` a `history`;
  - poner otro dígito incorrecto sobre un número incorrecto del jugador → `mistakes === 2`;
  - repetir el mismo dígito que ya tiene la celda → nada cambia (misma referencia);
  - poner un dígito incorrecto, hacer `erase` (o `undo`) y volver a poner **el mismo** dígito incorrecto en la misma celda → `mistakes` sube de 1 a 2 (caso límite "Mismo fallo repetido");
  - `erase`, `undo`, `toggleNotesMode` y `input` en modo notas no cambian `mistakes`;
  - `input` con una pista seleccionada → nada cambia;
  - un dígito incorrecto **no** quita ese dígito de las notas de las celdas relacionadas, y uno correcto sí (research R3);
  - `derive(g).wrong` contiene exactamente las celdas que no son pista con `values[i] !== 0 && values[i] !== solution[i]`, y queda vacío tras `erase` o `undo` de esa celda.
- [X] T007 [P] [US1] Ampliar `frontend/tests/component/board.test.tsx`:
  - al renderizar se ve el texto "Fallos: 0/3";
  - tras tocar `FIRST_EMPTY` y una tecla incorrecta, se ve "Fallos: 1/3" y el nombre accesible de esa celda termina en ", incorrecto";
  - tras tocar una tecla correcta en otra celda vacía, el contador no cambia;
  - **victoria con fallos (FR-009)**: renderizar con `initialGame` = `{ ...newGame(SUDOKU, Date.now()), values: <SOLUTION con FIRST_EMPTY a 0>, mistakes: 1 }`, seleccionar `FIRST_EMPTY` y tocar la tecla correcta. Comprobar que el `dialog` "¡Resuelto!" contiene "Fallos: 1/3", que tiene un botón "Nueva partida" y que no tiene ningún botón "Reintentar".

  Ampliar también `frontend/tests/component/keyboard.test.tsx` (caso límite "Teclado físico"): seleccionar `FIRST_EMPTY` con un clic, pulsar con `user.keyboard` un dígito distinto de `SOLUTION[FIRST_EMPTY]` y comprobar "Fallos: 1/3" y el nombre ", incorrecto"; después pulsar el dígito correcto y comprobar que el contador sigue en 1/3.

### Implementation for User Story 1

- [X] T008 [US1] En `frontend/src/domain/game.ts`, cambiar `setDigit` (hasta que pase T006):
  - calcular `wrong = digit !== g.puzzle.solution[cell]`;
  - si `wrong`, solo cambia la propia celda (`notes: 0`) y no se toca ninguna nota de `peers(cell)`;
  - pasar a `commit` un `mistakes` ya incrementado cuando `wrong`, para que el `Game` resultante tenga `mistakes: g.mistakes + 1`.

  La derrota a 3 se implementa en US2. Mantener `if (g.values[cell] === digit) return g` al principio.
- [X] T009 [US1] En `frontend/src/domain/game.ts`:
  - añadir `wrong: Set<CellIndex>` a `Derived`;
  - calcularlo en `derive` como `{ i | givens[i] === 0 && values[i] !== 0 && values[i] !== solution[i] }`.
- [X] T010 [P] [US1] En `frontend/src/i18n/es.ts`:
  - añadir `mistakes: (n: number, max: number) => \`Fallos: ${n}/${max}\``;
  - añadir `wrong?: boolean` a `CellLabelState` y hacer que `cell()` añada `, incorrecto` al final cuando `state.wrong`, después de `, en conflicto` si las dos se aplican.
- [X] T011 [US1] En `frontend/src/components/StatusBar.tsx`, mostrar entre el nivel y el cronómetro `<span className="status-mistakes" aria-live="polite">{es.mistakes(game?.mistakes ?? 0, MAX_MISTAKES)}</span>`.
- [X] T012 [US1] Pasar el estado incorrecto a las celdas:
  - en `frontend/src/components/Cell.tsx`, añadir la prop `wrong: boolean`, la clase `wrong` cuando sea `true` y pasar `wrong` a `es.cell(...)`;
  - en `frontend/src/components/Board.tsx`, pasar `wrong={derived.wrong.has(i)}`.
- [X] T013 [P] [US1] Añadir los estilos en `frontend/src/styles/app.css`:
  - `.cell.wrong { color: var(--conflict); background: var(--conflict-bg); }` y `.cell.wrong .cell-value { text-decoration: line-through 2px var(--conflict); }`. Colocar la regla **después** de `.cell.selected`, `.cell.same` y `.cell.related`, para que el fondo `--conflict-bg` prevalezca también cuando la celda incorrecta está seleccionada o resaltada (contraste medido: rojo sobre `--conflict-bg` ≈ 5,3:1 en claro y ≈ 6,7:1 en oscuro; rojo sobre `--selected` solo ≈ 4,2:1, por debajo de AA);
  - `.cell.selected.wrong { box-shadow: inset 0 0 0 3px var(--conflict); }`, igual que `.cell.selected.conflict`, para que la selección siga siendo inequívoca (constitución I);
  - si la celda es a la vez `.conflict.wrong`, combinar los dos con `text-decoration-line: underline line-through` y estilo `wavy` solo para el subrayado. Si no es posible, que prevalezca el tachado y que el conflicto se siga viendo por su fondo `--conflict-bg`;
  - un estilo `.status-mistakes` coherente con `.status-level` y `.status-timer` que quepa a 360 px sin salto de línea.
- [X] T014 [US1] En `frontend/src/components/dialogs/WinDialog.tsx`, añadir la prop `mistakes: number` y mostrar `<p>{es.mistakes(mistakes, MAX_MISTAKES)}</p>` debajo del tiempo (FR-009). En `frontend/src/App.tsx`, pasar `mistakes={game.mistakes}` a `WinDialog`.
- [X] T015 [US1] Ejecutar `npm test` en `frontend/`. T006 y T007 deben estar en verde, junto con todas las pruebas anteriores.

**Checkpoint**: el contador y la marca de fallo funcionan, pero todavía no se pierde a 3.

---

## Phase 4: User Story 2 - Perder la partida al llegar a 3 fallos (Priority: P1)

**Goal**: con el tercer fallo la partida pasa a `lost`. El tablero se bloquea y un diálogo
ofrece "Reintentar" (el mismo sudoku desde cero) o "Nueva partida".

**Independent Test**: cometer 3 fallos. Aparece el diálogo "Sin intentos", el tablero no
admite jugadas y el cronómetro se para. "Reintentar" muestra el mismo sudoku solo con pistas,
con 0/3 y 00:00. "Nueva partida" abre el diálogo de nivel sin pedir confirmación.

### Tests for User Story 2 ⚠️

- [X] T016 [P] [US2] Ampliar `frontend/tests/unit/game-mistakes.test.ts`:
  - con `mistakes: 2`, un dígito incorrecto deja `mistakes === 3`, `status === 'lost'` y `runningSince === null`, y `elapsedMs` acumula el tramo en marcha (usar `tick` con `now` antes, como hace `GameProvider`);
  - en `lost`, `input`, `erase` y `undo` devuelven la misma referencia;
  - `retry` en `lost` devuelve un `Game` con el mismo `puzzle`, `values` igual a `givens`, todas las `notes` a 0, `mistakes: 0`, `history: []`, `status: 'playing'`, `elapsedMs: 0`, `runningSince: now`, `notesMode: false` y `selected: null`;
  - `retry` en `playing` o `won` devuelve la misma referencia.
- [X] T017 [P] [US2] Crear `frontend/tests/e2e/mistakes.spec.ts` con Playwright, usando los helpers de `tests/e2e/helpers.ts` (`openGame`, `sudokuFor`, `play`, `emptyCells`):
  - con `?seed=12345`, cometer 3 fallos en 3 celdas vacías distintas usando un dígito distinto de `solution[i]`;
  - comprobar "Fallos: 3/3" y el `dialog` con el texto "Sin intentos";
  - tocar "Reintentar" y comprobar que todas las celdas vacías del puzle vuelven a estar vacías, que se ve "Fallos: 0/3" y que el temporizador muestra `00:00`;
  - volver a perder, tocar "Nueva partida" y comprobar que aparece el diálogo de elegir nivel, no el de confirmación;
  - ejecutar `AxeBuilder` con el diálogo de derrota abierto y comprobar que no hay infracciones;
  - ejecutar también `AxeBuilder` (regla `color-contrast`) **antes de perder**, justo después del primer fallo, con la celda incorrecta todavía seleccionada, y otra vez tras seleccionar una celda de su misma fila (celda incorrecta en estado "relacionada"). Ninguna de las dos pasadas debe tener infracciones. Repetir ambas con `colorScheme: 'dark'` (`page.emulateMedia`).

  Debe pasar en todos los proyectos de `frontend/playwright.config.ts`, incluido `mobile-360`.

### Implementation for User Story 2

- [X] T018 [US2] En `frontend/src/domain/game.ts` (hasta que pase T016):
  - tras aplicar un fallo, si `mistakes >= MAX_MISTAKES`, devolver `{ ...stopClock(next, null), status: 'lost' }`;
  - comprobar la derrota antes de `isSolved`;
  - implementar `case 'retry': return g.status === 'lost' ? newGame(g.puzzle, action.now) : g`.

  Confirmar que `undo` sigue devolviendo `g` cuando `status !== 'playing'` y que `resume` no reanuda el cronómetro en `lost`.
- [X] T019 [P] [US2] En `frontend/src/i18n/es.ts`, añadir `lost: 'Sin intentos'`, `lostText: 'Has cometido 3 fallos.'` y `retry: 'Reintentar'`.
- [X] T020 [US2] Crear `frontend/src/components/dialogs/LostDialog.tsx` a imagen de `WinDialog.tsx`:
  - props `{ onRetry: () => void; onNewGame: () => void }`;
  - `<Dialog title={es.lost}>` con `<p>{es.lostText}</p>`;
  - en `.dialog-actions`, primero el botón `btn primary` "Reintentar" (`onRetry`) y después el botón `btn` "Nueva partida" (`onNewGame`).
- [X] T021 [US2] En `frontend/src/App.tsx`, renderizar `<LostDialog>` cuando `game?.status === 'lost' && !generating && dialog === 'none'`:
  - `onRetry={() => dispatch({ type: 'retry', now: Date.now() })}`;
  - `onNewGame={() => setDialog('level')}`.

  `requestNewGame` ya evita la confirmación cuando `status !== 'playing'`; verificarlo. `useKeyboard` ya está desactivado fuera de `playing`.
- [X] T022 [US2] Comprobar en `frontend/src/state/GameProvider.tsx` que `restoreGame` solo reanuda el cronómetro con `status === 'playing'`, para que una partida `lost` se restaure parada, y que el intervalo de `tick` no corre en `lost`. No hace falta añadir nada al contexto, porque `retry` se despacha con `dispatch`. Si algo no cuadra, corregirlo aquí.
- [X] T023 [US2] Ejecutar `npm test` y `npx playwright test tests/e2e/mistakes.spec.ts` en `frontend/`, y dejar T016 y T017 en verde.

**Checkpoint**: el ciclo completo de jugar, perder y reintentar o empezar otra partida
funciona en memoria.

---

## Phase 5: User Story 3 - Conservar los fallos al volver (Priority: P2)

**Goal**: el número de fallos y el estado `lost` se guardan y se restauran. Las partidas
guardadas antes de esta funcionalidad se cargan con 0 fallos.

**Independent Test**: cometer un fallo y recargar → sigue en "Fallos: 1/3". Perder y recargar
→ sigue el diálogo "Sin intentos".

### Tests for User Story 3 ⚠️

- [X] T024 [P] [US3] Ampliar `frontend/tests/unit/serialization.test.ts`:
  - `toStored` incluye `mistakes`;
  - un ida y vuelta conserva `mistakes` y `status: 'lost'`;
  - un `StoredGame` sin `mistakes` se restaura con `mistakes: 0` (FR-008);
  - devuelven `null`: `mistakes` igual a `-1`, `4`, `1.5` o `"2"`; `status: 'lost'` con `mistakes: 2`; `status: 'playing'` con `mistakes: 3`; un `status` desconocido.
- [X] T025 [P] [US3] Ampliar `frontend/tests/e2e/persistence.spec.ts`:
  - cometer 1 fallo, recargar y ver "Fallos: 1/3";
  - cometer 3 fallos, recargar y ver el diálogo "Sin intentos" con el temporizador parado (el mismo valor tras 2 s);
  - **reintentar y recargar** (caso límite): cometer 3 fallos, tocar "Reintentar", poner un número correcto, recargar y comprobar que no aparece el diálogo "Sin intentos", que se ve "Fallos: 0/3" y que ese número correcto sigue en su celda.

### Implementation for User Story 3

- [X] T026 [US3] En `frontend/src/domain/serialization.ts`, cambiar `fromStored` (hasta que pase T024):
  - `status` acepta `'playing' | 'won' | 'lost'`;
  - `mistakes` vale `data.mistakes === undefined ? 0 : data.mistakes`;
  - rechazar con `null` si `mistakes` no es un entero en `0..MAX_MISTAKES`;
  - rechazar con `null` si no se cumple `(status === 'lost') === (mistakes === MAX_MISTAKES)`;
  - devolver `mistakes` en el `Game`.
- [X] T027 [US3] Actualizar el ejemplo y la tabla de validación de `specs/001-sudoku-tactil/contracts/storage-schema.md` con una nota que remita a `specs/002-limite-fallos/contracts/storage-schema.md`, para que el contrato base no quede desfasado.
- [X] T028 [US3] Ejecutar `npm test` y `npx playwright test tests/e2e/persistence.spec.ts` en `frontend/`, y dejarlo todo en verde.

**Checkpoint**: las tres historias funcionan y se pueden probar por separado.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T029 [P] Actualizar la documentación de la funcionalidad 001:
  - en `specs/001-sudoku-tactil/spec.md`, añadir a la suposición "Errores" una nota: "Sustituida por `002-limite-fallos`: los números que no coinciden con la solución cuentan como fallo y se marcan.";
  - en `specs/001-sudoku-tactil/spec.md`, añadir a FR-011 una nota: "Acotado por `002-limite-fallos`: solo se aplica a números correctos; un número incorrecto no quita notas.";
  - en `specs/001-sudoku-tactil/contracts/ui-contract.md`, añadir un enlace al contrato de interfaz de 002.
- [X] T030 [P] Añadir al `README.md` de la raíz una línea en la lista de funciones: límite de 3 fallos, con las opciones Reintentar y Nueva partida.
- [X] T031 Revisar visualmente con `npm run dev`, a 360×640 en vertical, 640×360 en horizontal y en modo claro y oscuro:
  - el contador cabe en la barra de estado sin scroll ni salto de línea;
  - la celda incorrecta se lee bien;
  - el diálogo de derrota tiene botones de al menos 44 px.

  Ajustar `frontend/src/styles/app.css` si hace falta.
- [X] T032 Ejecutar la batería completa en `frontend/`: `npm run typecheck`, `npm run lint`, `npm test` y `npm run test:e2e`. Seguir la verificación manual de `specs/002-limite-fallos/quickstart.md` (pasos 1-13 y compatibilidad con partidas antiguas) en emulación táctil a 360 px.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de la Fase 1 y bloquea todas las historias.
- **US1 (Fase 3)**: depende de la Fase 2.
- **US2 (Fase 4)**: depende de US1 (T008, porque la derrota se apoya en el conteo de `setDigit`).
- **US3 (Fase 5)**: depende de la Fase 2. Su prueba de dominio (T024) y la implementación
  (T026) son independientes de US1 y US2. La prueba e2e T025 necesita US1 y US2.
- **Polish (Fase 6)**: depende de las historias que se quieran entregar.

### Within Each User Story

- Las pruebas se escriben y fallan antes de implementar.
- Primero el dominio (`game.ts`, `serialization.ts`), después los textos (`es.ts`), después
  los componentes y por último `App.tsx`.

### Parallel Opportunities

- T006 ∥ T007 (archivos de prueba distintos).
- T010 ∥ T013 (`es.ts` ∥ `app.css`), en paralelo con T008/T009 (`game.ts`).
- T016 ∥ T017; T019 ∥ T018.
- T024 ∥ T025. US3 (T024 + T026) puede hacerse en paralelo con US1 o US2 por otra persona,
  porque solo toca `serialization.ts` y su prueba.
- T029 ∥ T030.

---

## Parallel Example: User Story 1

```bash
# Pruebas primero, en paralelo:
Task: "T006 game-mistakes.test.ts (conteo, wrong, notas)"
Task: "T007 board.test.tsx y keyboard.test.tsx (contador, celda incorrecta, victoria, teclado físico)"

# Después, en paralelo con el dominio:
Task: "T008-T009 game.ts"
Task: "T010 es.ts"
Task: "T013 app.css"
```

## Parallel Example: User Story 2

```bash
Task: "T016 game-mistakes.test.ts (lost y retry)"
Task: "T017 e2e/mistakes.spec.ts"
# Y luego:
Task: "T018 game.ts"
Task: "T019 es.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Fase 1 y Fase 2.
2. Fase 3 (US1): contador y marca de fallo.
3. **Parar y validar**: pasos 1-5 del quickstart.

### Incremental Delivery

1. US1: contador visible (sin derrota todavía).
2. US2: derrota a 3 fallos con Reintentar y Nueva partida. Es lo que pidió el usuario, así que
   **esta es la entrega mínima con valor real**.
3. US3: persistencia, que evita esquivar el límite recargando la página.
4. Polish.

### Notes

- [P] = archivos distintos y sin dependencias pendientes.
- Hacer un commit al cerrar cada fase.
- No añadir estadísticas, historial ni ajustes del límite (fuera de alcance).
