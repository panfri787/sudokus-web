# Contract: Interfaz de usuario (cambios)

**Feature**: `002-limite-fallos` | Base: [001 ui-contract](../../001-sudoku-tactil/contracts/ui-contract.md)

Los nombres accesibles sirven de selectores en Playwright, así que forman parte del contrato.

## Pantalla de juego

| Elemento | Rol / nombre accesible | Requisitos |
|----------|------------------------|------------|
| Contador de fallos | Texto visible "Fallos: N/3" en la barra de estado, con `aria-live="polite"` | FR-001 |
| Celda incorrecta | El nombre de la celda termina en ", incorrecto" (p. ej. "Fila 2, columna 5, valor 7, incorrecto") | FR-003 |

## Estados visuales de celda (nuevo)

| Estado | Señal visual | Señal no cromática (constitución V) |
|--------|--------------|-------------------------------------|
| Incorrecto | Texto en el color de conflicto sobre fondo de conflicto, que prevalece sobre la selección y el resaltado. Si está seleccionada, borde interior de 3 px en el color de conflicto | Texto tachado y ", incorrecto" en el nombre accesible |

Una celda puede estar a la vez incorrecta y en conflicto. En ese caso se aplican las dos
marcas.

El texto de una celda incorrecta MUST alcanzar un contraste ≥ 4,5:1 en cualquier estado
(normal, seleccionada o resaltada) y en modo claro y oscuro. Se verifica con axe en
`tests/e2e/mistakes.spec.ts`.

## Diálogos

| Diálogo | Contenido | Botones |
|---------|-----------|---------|
| Derrota (**nuevo**) | Título "Sin intentos" y el texto "Has cometido 3 fallos." | "Reintentar" (principal), "Nueva partida" |
| Victoria (ampliado) | "¡Resuelto!", el tiempo `mm:ss` y "Fallos: N/3" | "Nueva partida" (no se ofrece "Reintentar") |

- **"Reintentar"**: reinicia el mismo sudoku sin confirmación (FR-005b).
- **"Nueva partida"** desde la derrota: abre el diálogo de elegir nivel sin pasar por la
  confirmación de descarte (FR-006).
- El diálogo de derrota usa `role="dialog"` y `aria-modal="true"`, y recibe el foco, igual
  que el resto.
- Con la partida perdida, el teclado físico está desactivado igual que en la victoria.

## Layout

El contador cabe en la barra de estado existente sin añadir filas. Se mantiene la regla de
001: sin scroll desde 360×640 en vertical y desde 640×360 en horizontal.
