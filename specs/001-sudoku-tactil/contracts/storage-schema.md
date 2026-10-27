# Contract: Esquema de almacenamiento local

**Feature**: `001-sudoku-tactil` | Decisión en [research.md › R7](../research.md#r7-persistencia-local)

Solo `localStorage`. Sin cookies y sin transmitir nada fuera del dispositivo (FR-019).

## Claves

| Clave | Contenido |
|-------|-----------|
| `sudokus-web:v1:game` | Partida en curso o terminada (`StoredGame`). |
| `sudokus-web:v1:prefs` | Preferencias (`StoredPrefs`). |

El prefijo `v1` permite migrar o descartar formatos antiguos en versiones futuras.

## `StoredGame`

```jsonc
{
  "schema": 1,
  "puzzle": {
    "givens":   "530070000600195000…",   // 81 caracteres '0'-'9'
    "solution": "534678912672195348…",   // 81 caracteres '1'-'9'
    "difficulty": "medium",
    "seed": 123456789
  },
  "values": "534070000600195000…",       // 81 caracteres '0'-'9'
  "notes": [0, 0, 18, …],                 // 81 enteros 0..511
  "notesMode": false,
  "history": [
    { "kind": "set", "cell": 2, "digit": 4,
      "before": [{ "cell": 2, "value": 0, "notes": 8 }, { "cell": 11, "value": 0, "notes": 8 }] }
  ],
  "status": "playing",
  "elapsedMs": 183000,
  "startedAt": 1793100000000
}
```

`selected` y `runningSince` no se guardan: al restaurar, no hay celda seleccionada y el
cronómetro se reanuda si la página está visible y `status = "playing"`.

## `StoredPrefs`

```json
{ "schema": 1, "lastDifficulty": "medium" }
```

## Validación al cargar

Se descarta el dato (y se empieza partida nueva con `lastDifficulty`) si ocurre cualquiera de:

- JSON inválido, `schema` distinto de `1` o falta algún campo.
- Longitudes distintas de 81, caracteres o enteros fuera de rango.
- `values` no coincide con `givens` en alguna pista, o `solution` no es válida o no coincide con
  `givens`.
- Una `notes[i]` distinta de `0` en una celda con pista o con valor.
- `localStorage` no disponible o lanza excepción (modo privado, cuota): el juego funciona sin
  guardar.

Nunca se muestra un error técnico al jugador.
