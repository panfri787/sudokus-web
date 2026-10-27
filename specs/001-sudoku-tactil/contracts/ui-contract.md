# Contract: Interfaz de usuario

**Feature**: `001-sudoku-tactil` | Requisitos en [spec.md](../spec.md)

Contrato de lo que la interfaz expone al jugador y a las pruebas de extremo a extremo. Los
nombres accesibles se usan como selectores en Playwright (`getByRole`), así que cambiarlos
rompe el contrato.

## Pantalla de juego

| Elemento | Rol / nombre accesible | Requisitos |
|----------|------------------------|------------|
| Cabecera | Texto del nivel ("Fácil" / "Medio" / "Difícil") y cronómetro `mm:ss` (`role="timer"`) | FR-008, FR-014 |
| Tablero | `role="grid"`, nombre "Tablero de sudoku"; 9 `row` con 9 `gridcell` | — |
| Celda | `button` dentro de cada `gridcell`; nombre "Fila F, columna C, valor V" / "vacía" / "pista V" / "notas 1, 4" | FR-003, FR-004 |
| Teclado | `group` "Números"; botones "1" … "9" | FR-003, FR-016 |
| Borrar | `button` "Borrar" | FR-005 |
| Notas | `button` "Notas" con `aria-pressed` | FR-010 |
| Deshacer | `button` "Deshacer", `disabled` sin historial | FR-012 |
| Nueva partida | `button` "Nueva partida" | FR-009 |

## Estados visuales de celda

| Estado | Señal visual | Señal no cromática (constitución V) |
|--------|--------------|-------------------------------------|
| Pista | Texto en negrita, fondo neutro | Negrita |
| Valor del jugador | Texto en color de acento | Peso normal |
| Seleccionada | Fondo de acento fuerte | Borde grueso |
| Fila/columna/caja relacionada | Fondo tenue | — (información secundaria) |
| Mismo dígito | Fondo intermedio | — (información secundaria) |
| Conflicto | Texto y fondo rojos | Subrayado ondulado y "en conflicto" en el nombre accesible |
| Notas | Cuadrícula 3×3 de dígitos pequeños | Posición fija de cada dígito |

Tecla de un dígito colocado 9 veces: `aria-disabled="true"`, atenuada y con marca ✓.

## Diálogos

| Diálogo | Contenido | Botones |
|---------|-----------|---------|
| Elegir nivel | Título "Nueva partida" | "Fácil", "Medio", "Difícil", "Cancelar" |
| Confirmar descarte (con progreso) | "¿Empezar una partida nueva? Se perderá la actual." | "Empezar nueva", "Seguir jugando" |
| Victoria | "¡Resuelto!" y el tiempo `mm:ss` | "Nueva partida" |

Todos usan `role="dialog"` con `aria-modal="true"`, y el foco pasa al diálogo al abrirse.

## Teclado físico (uso secundario en escritorio)

| Tecla | Acción |
|-------|--------|
| `1`-`9` | Introducir dígito (o nota, en modo notas) |
| `Supr`, `Retroceso`, `0` | Borrar |
| Flechas | Mover la selección |
| `N` | Alternar modo notas |
| `Ctrl/Cmd + Z` | Deshacer |

## Restricciones de layout

- Sin scroll desde 360×640 CSS en vertical; en horizontal, teclado a la derecha del tablero.
- Teclas y botones ≥ 44×44 px. Celdas ≥ 36×36 px (constitución I, v1.0.1).
- Sin hover, doble toque ni pulsación larga como única vía de acción; nunca se abre el teclado
  del sistema.
- Respeta `prefers-color-scheme: dark` y `prefers-reduced-motion`.
- Todos los textos salen de `frontend/src/i18n/es.ts`.
