# Contract: API del dominio y protocolo del worker

**Feature**: `001-sudoku-tactil` | Tipos en [data-model.md](../data-model.md)

El módulo `frontend/src/domain/` es puro (sin DOM, sin React, sin almacenamiento) y se prueba en
Node. Esta es su superficie pública; cualquier cambio de firma es un cambio de contrato.

## Aleatoriedad

```ts
type Rng = () => number;                    // [0, 1)
function createRng(seed: number): Rng;      // mulberry32, determinista
function randomSeed(): number;              // crypto.getRandomValues
```

## Reglas y resolvedor

```ts
function findConflicts(values: Grid): Set<CellIndex>;
function peers(cell: CellIndex): readonly CellIndex[];   // 20 celdas de fila, columna y caja
function countSolutions(grid: Grid, limit: number): number; // se detiene al llegar a `limit`
function solve(grid: Grid): Grid | null;                  // primera solución o null
```

**Garantías**:

- `countSolutions(g, 2)` devuelve `0`, `1` o `2`, y nunca recorre más allá de la 2.ª solución.
- `findConflicts` solo considera celdas con valor distinto de `0`.

## Generador

```ts
const CLUE_RANGES: Record<Difficulty, { min: number; max: number }>;
// easy {36,45} · medium {30,35} · hard {24,29}

function generateSudoku(difficulty: Difficulty, seed: number): Sudoku;
```

**Garantías** (verificadas por pruebas de muestra, SC-002):

- `countSolutions(result.givens, 2) === 1`.
- `solve(result.givens)` es igual a `result.solution`.
- Nº de pistas dentro de `CLUE_RANGES[difficulty]` (ver research R3 para el caso límite).
- Misma `(difficulty, seed)` → mismo resultado.

## Partida (reducer)

```ts
type GameAction =
  | { type: 'select'; cell: CellIndex }
  | { type: 'input'; digit: Digit }
  | { type: 'erase' }
  | { type: 'undo' }
  | { type: 'toggleNotesMode' }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number };

function newGame(puzzle: Sudoku, now: number): Game;
function gameReducer(state: Game, action: GameAction): Game;   // pura, no muta `state`
function derive(state: Game): {
  conflicts: Set<CellIndex>;
  digitCounts: Record<Digit, number>;
  isComplete: boolean;
  hasProgress: boolean;
  highlight: { related: Set<CellIndex>; sameDigit: Set<CellIndex> };
};
```

Las reglas de cada acción están en [data-model.md › Reglas de validación](../data-model.md#reglas-de-validación-de-acciones).

## Protocolo del worker de generación

`frontend/src/workers/generator.worker.ts` envuelve `generateSudoku`.

```ts
// Hilo principal → worker
type GenerateRequest = { id: number; difficulty: Difficulty; seed: number };

// Worker → hilo principal
type GenerateResponse =
  | { id: number; ok: true; sudoku: Sudoku; durationMs: number }
  | { id: number; ok: false; error: string };
```

- Las respuestas llevan el `id` de la petición; el hilo principal ignora respuestas de
  peticiones obsoletas (por ejemplo, si se cambió de nivel mientras se generaba).
- Si el worker no está disponible o falla, el hilo principal genera de forma síncrona como
  respaldo.
