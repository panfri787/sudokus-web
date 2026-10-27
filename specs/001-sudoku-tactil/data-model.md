# Data Model: Sudoku aleatorio táctil

**Feature**: `001-sudoku-tactil` | **Date**: 2026-10-27 | **Plan**: [plan.md](./plan.md)

Todas las entidades viven en el dispositivo (sin backend). Los tipos se expresan en notación
TypeScript para fijar formas y restricciones; el código real se escribe en la implementación.

## Tipos base

| Tipo | Definición | Reglas |
|------|------------|--------|
| `Digit` | `1 \| 2 \| … \| 9` | Valor de una celda rellena. |
| `CellIndex` | entero `0..80` | `fila = floor(i / 9)`, `columna = i % 9`, `caja = floor(fila/3)*3 + floor(columna/3)`. |
| `Grid` | array de 81 `Digit \| 0` | `0` = vacía. Orden por filas. |
| `NoteMask` | entero `0..511` | Bit `d-1` activo = nota `d` presente. |
| `Difficulty` | `'easy' \| 'medium' \| 'hard'` | Rangos de pistas en [Sudoku](#sudoku). |

## Sudoku

Puzle generado; inmutable una vez creado.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `givens` | `Grid` | Pistas iniciales. Sin repeticiones en fila/columna/caja. |
| `solution` | `Grid` | Completa (sin `0`), válida, y coincide con `givens` en cada pista. |
| `difficulty` | `Difficulty` | Nº de pistas: easy 36-45, medium 30-35, hard 24-29 (ver research R3 para el caso de no alcanzarlo). |
| `seed` | entero 32 bits | Semilla usada; permite reproducir el puzle en pruebas. |

**Invariante**: `givens` tiene exactamente una solución y es `solution` (FR-001).

## Partida (`Game`)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `puzzle` | `Sudoku` | El puzle que se juega. |
| `values` | `Grid` | Valores actuales. En celdas con pista, siempre igual a `givens`. |
| `notes` | array de 81 `NoteMask` | Siempre `0` en celdas con pista o con valor. |
| `selected` | `CellIndex \| null` | Celda seleccionada. |
| `notesMode` | `boolean` | Modo notas activo (FR-010). |
| `history` | `Move[]` | Jugadas aplicadas, de la más antigua a la más reciente (FR-012). |
| `status` | `'playing' \| 'won'` | Ver transiciones. |
| `elapsedMs` | entero ≥ 0 | Tiempo acumulado con la partida visible y en juego (FR-008). |
| `runningSince` | marca de tiempo `\| null` | No nulo solo mientras el cronómetro corre. No se persiste en marcha: al guardar se suma a `elapsedMs`. |
| `startedAt` | marca de tiempo | Inicio de la partida. |

**Derivados** (se calculan, no se guardan):

- `conflicts: Set<CellIndex>`: celdas cuyo valor se repite en su fila, columna o caja (FR-006).
- `digitCounts: Record<Digit, number>`: cuántas veces aparece cada dígito; `9` desactiva la
  tecla (FR-016).
- `isComplete`: no hay `0` en `values` y `conflicts` está vacío (FR-007). Equivale a
  `values == solution` porque la solución es única.
- `hasProgress`: `history.length > 0` (usado para pedir confirmación en Nueva partida, FR-009).
- `highlight`: fila/columna/caja de `selected` y celdas con el mismo valor (FR-013).

## Jugada (`Move`)

Registro reversible de un cambio del jugador. Se guarda el estado anterior de **todas** las
celdas que la jugada modificó, incluidas las notas eliminadas automáticamente (FR-011), para
que deshacer sea exacto.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `kind` | `'set' \| 'erase' \| 'toggleNote'` | Tipo de jugada. |
| `cell` | `CellIndex` | Celda objetivo; nunca una pista. |
| `digit` | `Digit \| null` | Dígito introducido o nota alternada; `null` en `erase`. |
| `before` | `{ cell: CellIndex; value: Digit \| 0; notes: NoteMask }[]` | Estado previo de cada celda modificada. |

Las jugadas que no cambian nada (borrar una celda vacía, poner el mismo número que ya hay) no se
registran.

## Preferencias (`Prefs`)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `lastDifficulty` | `Difficulty` | Por defecto `'medium'`. Se actualiza al elegir nivel. |

## Transiciones de estado de la partida

```text
           nueva partida (nivel)
 (ninguna) ─────────────────────▶ playing
                                    │  set / erase / toggleNote / undo
                                    │◀─────────────┐
                                    ├──────────────┘
                                    │ isComplete pasa a true
                                    ▼
                                   won ──── nueva partida ───▶ playing (otro puzle)
```

- En `won` no se aceptan jugadas ni deshacer; el cronómetro está parado.
- Desde `playing` con `hasProgress`, "Nueva partida" requiere confirmación.
- Al cargar desde almacenamiento: `won` → se ofrece nueva partida (US4, escenario 2); dato
  inválido → nueva partida con `lastDifficulty`.

## Reglas de validación de acciones

| Acción | Precondición | Efecto |
|--------|--------------|--------|
| `select(i)` | — | `selected = i` (también en pistas, para resaltar). |
| `input(d)` con `notesMode = false` | `selected` no nulo, no pista, `status = playing` | `values[i] = d`, `notes[i] = 0`, quitar nota `d` de los pares de `i`; registrar `Move`. Si `isComplete`, `status = won`. |
| `input(d)` con `notesMode = true` | Igual, y `values[i] = 0` | Alternar bit `d` de `notes[i]`; registrar `Move`. |
| `erase()` | `selected` no pista, con valor o notas | `values[i] = 0`, `notes[i] = 0`; registrar `Move`. |
| `undo()` | `history` no vacío, `status = playing` | Restaurar `before` de la última jugada y quitarla. |
| `toggleNotesMode()` | — | Invierte `notesMode`. |
| Sin celda seleccionada | — | `input` / `erase` no hacen nada (caso límite). |
