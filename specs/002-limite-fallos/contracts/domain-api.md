# Contract: API del dominio (cambios)

**Feature**: `002-limite-fallos` | Base: [001 domain-api](../../001-sudoku-tactil/contracts/domain-api.md)

Todo se exporta desde `frontend/src/domain/index.ts` y sigue siendo puro (sin DOM ni React).

## Tipos

```ts
export const MAX_MISTAKES = 3

export type GameStatus = 'playing' | 'won' | 'lost'

export interface Game {
  // …campos de 001…
  readonly mistakes: number          // 0..MAX_MISTAKES
}

export type GameAction =
  // …acciones de 001…
  | { type: 'retry'; now: number }
```

## Funciones

| Función | Comportamiento nuevo |
|---------|----------------------|
| `newGame(puzzle, now)` | Devuelve también `mistakes: 0`. |
| `gameReducer(g, { type: 'input' })` | Fuera del modo notas, compara con `g.puzzle.solution`. Si el número es incorrecto: `mistakes + 1`, no limpia notas de las celdas relacionadas, y al llegar a `MAX_MISTAKES` pasa a `status: 'lost'` y detiene el cronómetro. |
| `gameReducer(g, { type: 'retry', now })` | Si `g.status === 'lost'`, devuelve `newGame(g.puzzle, now)`. En otro caso devuelve `g` sin cambios (misma referencia). |
| `derive(g)` | Añade `wrong: Set<CellIndex>` (celdas del jugador distintas de la solución). |
| `toStored` / `fromStored` | Ver [storage-schema.md](./storage-schema.md). |

## Garantías para las pruebas

- `erase`, `undo`, `toggleNotesMode`, `select`, `tick`, `pause` y `resume` nunca cambian
  `mistakes`.
- Poner el mismo número que ya tiene la celda no hace nada, así que tampoco cuenta como fallo.
- Poner un número incorrecto sobre otro número del jugador sí cuenta como fallo.
- Con `status !== 'playing'`, `input`, `erase` y `undo` devuelven la misma referencia `g`.
