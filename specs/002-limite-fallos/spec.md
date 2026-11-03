# Feature Specification: Límite de fallos por partida

**Feature Branch**: `002-limite-fallos`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Ahora llevaremos la cuenta de los fallos que se han realizado al intentar resolver el sudoku, si se cometen 3 fallos la partida habra finalizado y habra que empezar una nueva"

## Clarifications

### Session 2026-11-03

- Q: ¿Qué cuenta como fallo: un número distinto del de la solución, o solo uno que se repite
  en su fila, columna o caja? → A: Un número que no coincide con la solución. Esto sustituye
  la suposición "Errores" de la funcionalidad 001: a partir de ahora el juego sí indica que un
  número no va en esa celda.
- Q: Cuando la persona toca "Reintentar" tras perder, ¿qué ocurre con el tablero, los fallos y
  el tiempo? → A: Se vuelve a jugar el mismo sudoku desde cero: solo quedan las pistas, y los
  fallos, el tiempo y el historial de jugadas vuelven a 0.
- Q: Cuando la persona gana un sudoku, ¿el mensaje de victoria también debe ofrecer
  "Reintentar"? → A: No. "Reintentar" solo aparece al perder; la victoria ofrece solo
  "Nueva partida".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver cuántos fallos llevo (Priority: P1)

Durante la partida, la persona ve un contador de fallos con el formato "Fallos: N/3". Cada vez
que introduce un número incorrecto, el contador sube y recibe un aviso visual inmediato.

**Why this priority**: sin contar los fallos no puede haber límite. El contador por sí solo ya
añade reto y sirve de referencia para el jugador.

**Independent Test**: empezar una partida, introducir un número incorrecto en una celda vacía
y comprobar que el contador pasa de 0/3 a 1/3 y que la jugada se señala como fallo.

**Acceptance Scenarios**:

1. **Given** una partida nueva, **When** se muestra la pantalla de juego, **Then** el contador
   indica "Fallos: 0/3".
2. **Given** hay una celda vacía seleccionada, **When** la persona introduce un número que
   no coincide con el de la solución, **Then** el contador sube en 1 y la
   celda se marca como fallo con color y con un indicador que no depende solo del color.
3. **Given** hay una celda vacía seleccionada, **When** la persona introduce un número
   correcto, **Then** el contador no cambia.
4. **Given** el contador está en 1/3, **When** la persona deshace o borra la jugada errónea,
   **Then** el contador sigue en 1/3.
5. **Given** el modo notas está activo, **When** la persona añade o quita una nota con
   cualquier número, **Then** el contador no cambia.

---

### User Story 2 - Perder la partida al llegar a 3 fallos (Priority: P1)

Al cometer el tercer fallo, la partida termina. Se muestra un mensaje de partida perdida con
dos opciones: "Nueva partida" (otro sudoku) o "Reintentar" (el mismo sudoku desde cero). El
tablero ya no admite jugadas.

**Why this priority**: es la regla que ha pedido el usuario de forma explícita y la que da
sentido al contador.

**Independent Test**: cometer tres fallos en una partida y comprobar que aparece el mensaje de
partida perdida, que el tablero queda bloqueado, que "Nueva partida" empieza un sudoku nuevo
con el contador a 0/3 y que "Reintentar" vuelve a mostrar el mismo sudoku con solo sus pistas.

**Acceptance Scenarios**:

1. **Given** el contador está en 2/3, **When** la persona comete otro fallo, **Then** el
   contador muestra 3/3, el cronómetro se detiene y aparece un mensaje de partida perdida con
   los botones "Nueva partida" y "Reintentar".
2. **Given** la partida está perdida, **When** la persona toca el tablero, el teclado
   numérico, "Borrar", "Deshacer" o el modo notas, **Then** el tablero no cambia.
3. **Given** la partida está perdida, **When** la persona toca "Nueva partida", **Then**
   aparece un sudoku distinto con el contador a 0/3, sin pedir confirmación.
4. **Given** la partida está perdida, **When** la persona recarga la página, **Then** sigue
   viendo la partida perdida y el mensaje, no una partida jugable.
5. **Given** la partida está perdida, **When** la persona toca "Reintentar", **Then** aparece
   el mismo sudoku con solo sus pistas, sin números ni notas de la persona, con
   "Fallos: 0/3", el cronómetro a 0 y "Deshacer" desactivado, sin pedir confirmación.
6. **Given** la persona ha reintentado un sudoku, **When** comete otros 3 fallos, **Then**
   vuelve a perder y puede reintentarlo de nuevo, sin límite de reintentos.

---

### User Story 3 - Conservar los fallos al volver (Priority: P2)

El número de fallos se guarda con la partida en curso. Al recargar o volver más tarde, la
persona sigue con los mismos fallos.

**Why this priority**: si recargar la página pusiera el contador a cero, el límite sería
fácil de esquivar y no tendría sentido. Es menos visible que las historias anteriores.

**Independent Test**: cometer un fallo, recargar la página y comprobar que el contador sigue
en 1/3.

**Acceptance Scenarios**:

1. **Given** una partida con 2 fallos, **When** la persona recarga la página o cierra y abre
   el navegador, **Then** la partida se restaura con "Fallos: 2/3".
2. **Given** una partida guardada con la versión anterior, sin contador de fallos, **When**
   se restaura, **Then** empieza con "Fallos: 0/3" y se puede seguir jugando.

---

### Edge Cases

- **Mismo fallo repetido**: introducir el mismo número incorrecto en la misma celda tras
  borrarlo o deshacerlo cuenta como un fallo nuevo.
- **Sustituir un número**: escribir un número incorrecto sobre una celda que ya tiene otro
  número también cuenta como fallo.
- **Celda con pista**: tocar un número con una pista seleccionada no cambia nada ni cuenta
  como fallo.
- **Victoria con fallos**: si la persona completa el sudoku con 1 o 2 fallos, gana la
  partida y el mensaje de victoria indica también cuántos fallos cometió. El mensaje de
  victoria ofrece solo "Nueva partida", no "Reintentar".
- **Último número incorrecto**: si el tercer fallo llena la última celda vacía, la partida se
  pierde, no se gana.
- **Teclado físico**: los números introducidos con el teclado físico cuentan igual que los
  tocados.
- **Partida perdida y "Deshacer"**: no se puede deshacer el tercer fallo para seguir jugando;
  la única forma de volver a jugar ese sudoku es "Reintentar".
- **Reintentar y recargar**: si la persona recarga la página después de reintentar, se
  restaura la partida reintentada en su estado actual, no la partida perdida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en todo momento de la partida un contador de fallos
  con el formato "Fallos: N/3".
- **FR-002**: El sistema MUST considerar fallo cada número definitivo introducido en una
  celda que no es pista y que no coincide con el número de esa celda en la solución del
  sudoku, y MUST sumar 1 al contador al momento.
- **FR-003**: El sistema MUST señalar cada fallo en el momento en que se produce, con un
  indicador que no dependa solo del color.
- **FR-004**: Añadir o quitar notas, borrar y deshacer MUST NOT cambiar el contador de fallos.
- **FR-005**: Al llegar a 3 fallos, el sistema MUST dar la partida por perdida: detener el
  cronómetro, bloquear cualquier cambio en el tablero y mostrar un mensaje de partida perdida
  con las opciones "Nueva partida" y "Reintentar".
- **FR-005b**: "Reintentar" MUST reiniciar el mismo sudoku (mismas pistas y misma dificultad):
  quitar todos los números y notas de la persona y poner a 0 los fallos, el cronómetro y el
  historial de jugadas. No pide confirmación y se puede usar las veces que se quiera.
- **FR-006**: Empezar una partida nueva o reintentar MUST poner el contador a 0. Si la
  partida actual ya está perdida, ninguna de las dos opciones pide confirmación.
- **FR-007**: El sistema MUST guardar en el dispositivo el número de fallos y el estado de
  partida perdida junto con la partida en curso, y restaurarlos al volver.
- **FR-008**: Las partidas guardadas antes de esta funcionalidad MUST restaurarse con 0
  fallos.
- **FR-009**: El mensaje de victoria MUST indicar también el número de fallos cometidos y
  MUST ofrecer solo "Nueva partida"; "Reintentar" MUST aparecer únicamente al perder.
- **FR-010**: El límite de 3 fallos MUST aplicarse igual en todos los niveles de dificultad.

### Key Entities

- **Partida**: suma el contador de fallos (0 a 3) y un nuevo estado final, "perdida",
  además de "en curso" y "ganada".
- **Fallo**: un número definitivo incorrecto introducido por la persona. Solo existe como
  suma en el contador; no se guarda una lista de fallos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los números incorrectos introducidos suman exactamente un fallo, y
  ningún número correcto, nota, borrado ni deshacer cambia el contador.
- **SC-002**: El contador y el aviso de fallo se actualizan en menos de 100 ms tras
  introducir el número.
- **SC-003**: En el 100 % de las partidas que llegan a 3 fallos se muestra el mensaje de
  partida perdida y no se puede hacer ninguna jugada más.
- **SC-004**: Tras una recarga, el 100 % de las partidas restauradas conservan su número de
  fallos y su estado (en curso, ganada o perdida).
- **SC-005**: Desde el mensaje de partida perdida, la persona empieza una partida nueva o
  reintenta el mismo sudoku con un solo toque.

## Assumptions

- El límite es fijo, 3 fallos, igual para todas las dificultades y sin ajuste para cambiarlo
  ni desactivarlo (YAGNI).
- El contador es acumulativo: deshacer o borrar un fallo no lo descuenta. Si no, el límite se
  podría esquivar.
- Tras perder, la persona no puede seguir con el tablero tal como estaba ni ver la solución;
  solo puede empezar una partida nueva o reintentar el mismo sudoku desde cero.
- La partida perdida no se guarda en ningún historial ni estadística; siguen fuera de alcance
  como en la funcionalidad 001.
- Se mantiene el marcado de conflictos (repeticiones) de la funcionalidad 001. Un número que
  se repite nunca coincide con la solución, así que siempre cuenta además como fallo.
- Esta funcionalidad sustituye la suposición "Errores" de la funcionalidad 001: marcar un
  número como fallo indica que no va en esa celda (revela parte de la solución), pero no
  muestra cuál es el número correcto.
- El número incorrecto se queda en la celda, marcado como fallo, hasta que la persona lo
  borra, lo sustituye o deshace la jugada.
