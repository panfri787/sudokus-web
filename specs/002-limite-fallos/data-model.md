# Data Model: Límite de fallos por partida

**Feature**: `002-limite-fallos` | Base: [001 data-model](../001-sudoku-tactil/data-model.md)

Solo se describen los cambios. El resto de entidades (`Sudoku`, `Move`, `CellSnapshot`…) no
cambia.

## Game (ampliado)

| Campo | Tipo | Cambio | Regla |
|-------|------|--------|-------|
| `mistakes` | entero `0..3` | **nuevo** | Empieza en 0. Solo sube; nunca baja dentro de la misma partida. |
| `status` | `'playing' \| 'won' \| 'lost'` | se añade `'lost'` | `'lost'` si y solo si `mistakes === 3`. |

Constante de dominio: `MAX_MISTAKES = 3` (igual para todas las dificultades, FR-010).

### Invariantes

- `0 ≤ mistakes ≤ MAX_MISTAKES`.
- `status === 'lost'` ⇔ `mistakes === MAX_MISTAKES`.
- `status !== 'playing'` ⇒ `runningSince === null` (el cronómetro está parado).
- `mistakes` no forma parte de `Move.before`, así que deshacer nunca lo cambia.

## Valor derivado: celdas incorrectas

`derive(g).wrong: Set<CellIndex>` = `{ i | givens[i] = 0 ∧ values[i] ≠ 0 ∧ values[i] ≠ solution[i] }`

No se guarda. Las celdas incorrectas pueden estar también en `conflicts`.

## Reglas al poner un número (`input` fuera del modo notas)

Precondiciones, igual que en 001: hay una celda seleccionada, `status === 'playing'`, la celda
no es pista y su valor actual es distinto del número.

| Caso | Tablero | Notas de las celdas relacionadas | `mistakes` | `status` |
|------|---------|----------------------------------|------------|----------|
| `digit === solution[cell]` | se pone el número | se quita `digit` (FR-011 de 001) | sin cambio | `won` si el tablero queda resuelto |
| `digit !== solution[cell]` | se pone el número | **sin cambio** (research R3) | `+1` | `lost` si llega a 3 (cronómetro parado) |

En los dos casos se registra la jugada en `history`, de modo que se puede deshacer mientras la
partida siga en curso.

## Transiciones de estado

```text
            input correcto que completa el tablero
 playing ──────────────────────────────────────────▶ won
    │  ▲
    │  │ retry (mismo puzle, todo a 0)
    │  │
    ▼  │
   lost ◀── input incorrecto con mistakes = 2

 won / lost ── nueva partida (otro puzle) ──▶ playing
 playing   ── nueva partida (con confirmación si hay progreso) ──▶ playing
```

En `won` y `lost` no tienen efecto `input`, `erase`, `undo` ni `retry` (este último salvo en
`lost`). `select` y `toggleNotesMode` no cambian el tablero.

## Acciones

| Acción | Cambio |
|--------|--------|
| `input` | Ver la tabla de reglas anterior. |
| `retry { now }` | **Nueva**. Solo con `status === 'lost'`: resultado igual a `newGame(g.puzzle, now)`. |
| `erase`, `undo` | Sin cambios. No tocan `mistakes`. |

## Persistencia

Ver [contracts/storage-schema.md](./contracts/storage-schema.md). `mistakes` se guarda siempre
y es opcional al leer (vale 0 si falta).
