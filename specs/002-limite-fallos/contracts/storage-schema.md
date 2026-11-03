# Contract: Esquema de almacenamiento (cambios)

**Feature**: `002-limite-fallos` | Base: [001 storage-schema](../../001-sudoku-tactil/contracts/storage-schema.md)

La clave sigue siendo `sudokus-web:v1:game` y el esquema sigue siendo `schema: 1`
(research R6).

## `StoredGame` (ampliado)

```jsonc
{
  "schema": 1,
  // …campos de 001…
  "status": "lost",        // 'playing' | 'won' | 'lost'
  "mistakes": 3            // NUEVO: entero 0..3; opcional al leer
}
```

## Escritura (`toStored`)

Siempre escribe `mistakes`.

## Validación al cargar (`fromStored`)

Se mantienen todas las reglas de 001, más estas:

| Regla | Si no se cumple |
|-------|-----------------|
| `mistakes` ausente → se toma como `0` | — (partida de versión anterior, FR-008) |
| `mistakes` presente → entero en `0..3` | se descarta la partida (`null`) |
| `status` ∈ `'playing' \| 'won' \| 'lost'` | `null` |
| `status === 'lost'` ⇔ `mistakes === 3` | `null` |

Una partida restaurada en `lost` o `won` se carga con el cronómetro parado
(`runningSince: null`).
