# Research: Límite de fallos por partida

**Feature**: `002-limite-fallos` | **Plan**: [plan.md](./plan.md)

No quedaban `NEEDS CLARIFICATION` en el contexto técnico: la pila es la de la funcionalidad
001. Esta fase recoge las decisiones de diseño que la spec deja abiertas.

## R1. Cómo detectar un fallo

- **Decision**: al poner un número definitivo (`input` fuera del modo notas) en una celda que
  no es pista, es fallo si `digit !== puzzle.solution[cell]`. La comprobación se hace en el
  reducer en el momento de poner el número.
- **Rationale**: la solución ya está en `Game.puzzle.solution` y es única (constitución II).
  Comparar una celda es O(1). Contar en el reducer, y no derivarlo del tablero, permite que
  borrar o deshacer no reste fallos (FR-004).
- **Alternatives considered**:
  - *Derivar los fallos de las celdas incorrectas actuales*: se descartó porque borrar
    restaría fallos.
  - *Contar los conflictos de reglas*: lo descartó la aclaración Q1.

## R2. Cómo marcar la celda incorrecta

- **Decision**: `derive(g).wrong` es el conjunto de celdas que no son pista y cuyo valor es
  distinto de cero y de `puzzle.solution[i]`. No se guarda: se calcula a partir de `values`.
- **Rationale**: no hay estado redundante. Tras restaurar, deshacer o borrar, la marca es
  siempre coherente con el tablero (escenario US1-2 y suposición "el número incorrecto se queda
  en la celda hasta que se borra").
- **Alternatives considered**: guardar un conjunto `wrongCells` en `Game`. Habría que mantenerlo
  sincronizado en borrar, deshacer y restaurar, sin ninguna ventaja.

## R3. Notas de las celdas relacionadas al poner un número incorrecto

- **Decision**: un número incorrecto **no** quita ese dígito de las notas de su fila, columna
  y caja. Un número correcto sí lo hace, como hasta ahora (FR-011 de 001).
- **Rationale**: el número incorrecto es falso por definición. Si borrara notas, la persona
  perdería candidatos válidos por culpa de un error que ya le cuesta un fallo. Las apps de
  sudoku con límite de fallos se comportan así.
- **Alternatives considered**: mantener la limpieza para cualquier número. Es más simple, pero
  castiga dos veces el mismo error.

## R4. Representación de la derrota

- **Decision**: `GameStatus = 'playing' | 'won' | 'lost'` y `Game.mistakes: number` (0..3),
  con la constante `MAX_MISTAKES = 3`. Al llegar a 3, se detiene el cronómetro como en
  `win` y `status` pasa a `'lost'`.
- **Rationale**: el reducer ya bloquea `input`, `erase` y `undo` cuando `status !== 'playing'`
  y no reanuda el cronómetro fuera de `playing`. Así el bloqueo del tablero (FR-005) sale casi
  sin código nuevo.
- **Orden**: se comprueba la derrota antes que la victoria. Un número incorrecto nunca
  completa un tablero válido, porque la solución es única, pero el orden deja explícito el
  caso límite "Último número incorrecto".

## R5. Reintentar

- **Decision**: nueva acción `{ type: 'retry'; now: number }`, que solo tiene efecto con
  `status === 'lost'` y devuelve `newGame(g.puzzle, now)`. Así se conservan las pistas y la
  dificultad, y se ponen a cero los valores, las notas, los fallos, el historial, el
  cronómetro y el modo notas.
- **Rationale**: reutiliza `newGame` y respeta la aclaración Q2 (desde cero). Al estar en el
  reducer puro, se puede probar sin interfaz.
- **Alternatives considered**: implementarlo en `GameProvider` con `load`. Funciona, pero saca
  una regla de juego del dominio.

## R6. Compatibilidad del almacenamiento

- **Decision**: se mantiene `schema: 1` y `mistakes` pasa a ser opcional al leer. Si falta,
  vale 0. Si existe, debe ser un entero de 0 a 3. `status` acepta `'lost'` y se valida que
  `status === 'lost'` si y solo si `mistakes === 3`. Al escribir, siempre se incluye
  `mistakes`.
- **Rationale**: cumple FR-008 (las partidas antiguas se restauran con 0 fallos) sin
  migración. Si una versión antigua de la app leyera una partida `lost`, la rechazaría por el
  estado desconocido y empezaría otra, lo que es aceptable.
- **Alternatives considered**: pasar a `schema: 2` con migración. Supone más código para un
  único campo opcional.

## R7. Presentación

- **Decision**:
  - **Contador**: "Fallos: N/3" en la `StatusBar`, entre el nivel y el cronómetro, con
    `aria-live="polite"` para que los lectores de pantalla anuncien cada fallo.
  - **Celda incorrecta**: texto en el color de conflicto (`--conflict`), tachado y sobre fondo
    `--conflict-bg`. Ese fondo prevalece sobre los de selección y resaltado, y la selección se
    indica con un borde interior de 3 px en `--conflict`. Su nombre accesible
    termina en ", incorrecto". Si además está en conflicto, se mantiene también el subrayado
    de conflicto.
  - **Diálogo de derrota**: título "Sin intentos", el texto "Has cometido 3 fallos." y los
    botones "Reintentar" (principal) y "Nueva partida".
  - **Victoria**: añade la línea "Fallos: N/3".
- **Contraste (constitución V)**: el rojo de `--conflict` sobre el fondo de selección
  `--selected` solo alcanza ≈ 4,2:1, por debajo del 4,5:1 de AA para un número de ~21 px con
  peso normal. Una celda incorrecta suele estar seleccionada justo después de escribirla, así
  que el fondo propio es obligatorio. Con `--conflict-bg` se obtiene ≈ 5,3:1 en claro y
  ≈ 6,7:1 en oscuro. Es el mismo criterio que ya usa `.cell.conflict`.
- **Rationale**: el tachado cumple la regla de no depender solo del color (constitución V,
  FR-003). La barra de estado ya existe en los dos layouts. Reintentar es la acción principal
  porque la persona acaba de invertir tiempo en ese sudoku.
- **Nueva partida desde la derrota**: abre el diálogo de nivel sin pedir confirmación.
  `requestNewGame` ya omite la confirmación cuando `status !== 'playing'` (FR-006).
