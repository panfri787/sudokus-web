# Feature Specification: Sudoku aleatorio táctil

**Feature Branch**: `001-sudoku-tactil`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "construir una web en la que se generen de forma aleatoria sudokus y que se puedan resolver de forma sencilla utilizando una interfaz adaptada a pantallas táctiles"

## Clarifications

### Session 2026-10-27

- Q: ¿Qué debe hacer el backend en Python en esta primera versión? → A: Ninguno; sin backend
  en esta versión. Todo (incluida la generación) se ejecuta en el navegador con
  TypeScript/React; Python es el lenguaje fijado para cualquier backend futuro.
- Q: ¿La web debe recoger algún dato de uso o analítica de los jugadores? → A: No; ninguna
  analítica ni cookies; solo se guarda la partida en el dispositivo y nada sale de él.
- Q: ¿La web debe poder instalarse como aplicación y abrirse sin conexión en frío? → A: No;
  solo funciona sin conexión una vez cargada la página; no es instalable y sin red no abre
  tras una recarga.
- Q: ¿Dónde se va a publicar la web para que la gente pueda jugar? → A: Solo en local por
  ahora; la publicación se decidirá más adelante.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jugar un sudoku nuevo hasta resolverlo (Priority: P1)

Una persona abre la web en su móvil y encuentra un sudoku nuevo, generado al azar, listo para
jugar. Toca una celda vacía, toca un número del teclado numérico en pantalla y el número
aparece en la celda. Repite hasta llenar el tablero y la web le confirma que lo ha resuelto.
Desde ahí puede empezar otra partida con un nuevo sudoku.

**Why this priority**: es el núcleo del producto. Con solo esta historia ya existe un juego
completo y utilizable.

**Independent Test**: abrir la web en un dispositivo táctil, completar un sudoku solo con
toques y comprobar que aparece el mensaje de victoria y que se puede iniciar otra partida.

**Acceptance Scenarios**:

1. **Given** la persona abre la web por primera vez, **When** la página termina de cargar,
   **Then** ve un sudoku 9×9 nuevo con pistas iniciales y un teclado numérico del 1 al 9.
2. **Given** hay una celda vacía seleccionada, **When** toca un número del teclado,
   **Then** ese número aparece en la celda.
3. **Given** una celda con pista inicial, **When** la persona la toca, **Then** la celda no
   se puede modificar.
4. **Given** una celda rellenada por la persona, **When** la selecciona y toca "Borrar",
   **Then** la celda vuelve a quedar vacía.
5. **Given** la persona introduce un número que se repite en su fila, columna o caja 3×3,
   **When** el número aparece, **Then** las celdas en conflicto se marcan visualmente con
   color y con un indicador que no depende solo del color.
6. **Given** queda una sola celda vacía, **When** la persona la completa correctamente,
   **Then** se muestra un mensaje de victoria con el tiempo empleado y la opción "Nueva
   partida".
7. **Given** una partida en curso, **When** la persona toca "Nueva partida" y lo confirma,
   **Then** aparece un sudoku distinto.

---

### User Story 2 - Ayudas para resolver: notas y deshacer (Priority: P2)

Mientras juega, la persona puede activar el modo notas para apuntar varios números candidatos
pequeños en una celda, y puede deshacer sus últimas jugadas si se equivoca.

**Why this priority**: las notas y el deshacer son lo que hace que resolver sea "sencillo"
en sudokus de nivel medio o difícil, pero el juego funciona sin ellas.

**Independent Test**: activar el modo notas, apuntar candidatos en una celda, introducir un
número definitivo y deshacer jugadas, comprobando cada estado del tablero.

**Acceptance Scenarios**:

1. **Given** el modo notas está activado y hay una celda vacía seleccionada, **When** la
   persona toca un número, **Then** ese número se añade como nota pequeña en la celda, o se
   quita si ya estaba.
2. **Given** una celda con notas, **When** la persona introduce un número definitivo,
   **Then** las notas de esa celda desaparecen.
3. **Given** la persona coloca un número definitivo, **When** ese número aparece, **Then**
   se eliminan automáticamente las notas con ese mismo número de su fila, columna y caja.
4. **Given** la persona ha hecho una o más jugadas, **When** toca "Deshacer", **Then** el
   tablero vuelve al estado anterior a la última jugada, incluidas las notas.
5. **Given** una celda seleccionada con un número, **When** se muestra el tablero, **Then**
   se resaltan su fila, su columna, su caja y todas las celdas que tienen el mismo número.

---

### User Story 3 - Elegir la dificultad (Priority: P3)

Antes de empezar una partida nueva, la persona elige el nivel de dificultad: Fácil, Medio o
Difícil.

**Why this priority**: amplía el público (principiantes y jugadores con experiencia), pero
un único nivel equilibrado ya ofrece valor.

**Independent Test**: generar varias partidas en cada nivel y comprobar que el número de
pistas iniciales cae dentro del rango definido para ese nivel.

**Acceptance Scenarios**:

1. **Given** la persona toca "Nueva partida", **When** se le pide el nivel, **Then** puede
   elegir entre Fácil, Medio y Difícil con un solo toque.
2. **Given** ha elegido un nivel, **When** se genera el sudoku, **Then** el número de pistas
   iniciales corresponde al rango de ese nivel (ver Supuestos).
3. **Given** una partida en curso, **When** la persona mira la pantalla, **Then** ve
   indicado el nivel de la partida actual.

---

### User Story 4 - Retomar la partida (Priority: P4)

Si la persona cierra la pestaña, recarga la página o el navegador se cierra, al volver
encuentra la partida tal como la dejó.

**Why this priority**: en móvil las interrupciones son frecuentes, pero es una mejora sobre
el juego básico.

**Independent Test**: hacer varias jugadas, recargar la página y comprobar que el tablero,
las notas, el nivel y el tiempo se conservan.

**Acceptance Scenarios**:

1. **Given** una partida en curso con jugadas y notas, **When** la persona recarga la página,
   **Then** ve el mismo tablero, las mismas notas, el mismo nivel y el tiempo acumulado.
2. **Given** una partida ya completada, **When** la persona vuelve a la web, **Then** se le
   ofrece empezar una nueva partida.

---

### Edge Cases

- **Nueva partida con progreso**: si la persona toca "Nueva partida" con una partida
  empezada, se le pide confirmación antes de descartarla.
- **Tablero lleno pero incorrecto**: si todas las celdas están llenas pero hay conflictos, no
  se declara victoria y los conflictos siguen marcados.
- **Toque sin celda seleccionada**: si se toca un número sin celda seleccionada, no ocurre
  nada y no aparece ningún error.
- **Deshacer sin historial**: el botón "Deshacer" aparece desactivado cuando no hay jugadas
  que deshacer.
- **Cambio de orientación**: al girar el dispositivo, el tablero se reorganiza sin perder la
  selección ni el progreso.
- **Toques rápidos o dobles**: un doble toque no hace zoom en la página ni introduce el
  número dos veces.
- **Partida guardada ilegible**: si los datos guardados no se pueden leer, se empieza una
  partida nueva sin mostrar un error técnico.
- **Pantallas grandes**: en escritorio, el tablero mantiene un tamaño cómodo y también se
  puede jugar con ratón y con las teclas 1-9, Supr y Retroceso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST generar al azar sudokus 9×9 válidos con exactamente una solución.
- **FR-002**: El sistema MUST mostrar un sudoku listo para jugar al abrir la web, sin pasos
  previos obligatorios.
- **FR-003**: Las personas MUST poder seleccionar una celda con un toque e introducir un
  número del 1 al 9 con un segundo toque en un teclado numérico en pantalla.
- **FR-004**: El sistema MUST impedir que se modifiquen las pistas iniciales y MUST
  diferenciarlas visualmente de los números introducidos por la persona.
- **FR-005**: Las personas MUST poder borrar el número de una celda que hayan rellenado.
- **FR-006**: El sistema MUST marcar al momento los números que se repiten en una fila,
  columna o caja 3×3, con un indicador que no dependa solo del color.
- **FR-007**: El sistema MUST detectar que el tablero está completo y correcto y mostrar un
  mensaje de victoria con el tiempo empleado.
- **FR-008**: El sistema MUST mostrar un cronómetro de la partida, que se detiene cuando la
  página no está visible y al terminar la partida.
- **FR-009**: Las personas MUST poder iniciar una partida nueva en cualquier momento,
  confirmando antes si hay progreso que se perdería.
- **FR-010**: Las personas MUST poder activar y desactivar un modo notas para añadir o quitar
  candidatos en una celda.
- **FR-011**: El sistema MUST eliminar automáticamente las notas que coinciden con un número
  definitivo recién colocado en su misma fila, columna o caja.
- **FR-012**: Las personas MUST poder deshacer jugadas una a una (números, borrados y notas)
  hasta el inicio de la partida.
- **FR-013**: El sistema MUST resaltar la fila, la columna y la caja de la celda seleccionada,
  y las celdas con el mismo número.
- **FR-014**: Las personas MUST poder elegir la dificultad (Fácil, Medio, Difícil) al empezar
  una partida nueva, y el sistema MUST mostrar el nivel de la partida en curso.
- **FR-015**: El sistema MUST guardar en el dispositivo la partida en curso (tablero, notas,
  nivel, tiempo e historial) y restaurarla al volver.
- **FR-016**: El teclado numérico MUST indicar qué números ya están colocados nueve veces.
- **FR-017**: Toda la interacción MUST funcionar solo con toques, sin hover, doble toque ni
  pulsación larga, y sin abrir el teclado del sistema.
- **FR-018**: Una vez cargada la página, el juego MUST seguir funcionando aunque se pierda la
  conexión (nuevas partidas incluidas), y MUST NOT requerir registro. Abrir o recargar la web
  sin conexión no está soportado.
- **FR-019**: El sistema MUST NOT recoger analítica, usar cookies ni enviar datos del jugador
  fuera del dispositivo; la única información almacenada es la partida en curso y el último
  nivel elegido, guardados localmente.

### Key Entities

- **Sudoku**: un puzle 9×9 con su conjunto de pistas iniciales, su solución única y su nivel
  de dificultad.
- **Partida**: un intento de resolver un sudoku. Incluye el estado de cada celda, las notas,
  el historial de jugadas, el tiempo acumulado y si está en curso o completada.
- **Celda**: una posición del tablero (fila y columna) que puede ser pista inicial, estar
  vacía, tener un número de la persona o tener notas. Puede estar en conflicto.
- **Jugada**: un cambio hecho por la persona (poner número, borrar, añadir o quitar nota),
  que se guarda para poder deshacerlo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona que entra por primera vez puede empezar a introducir números en
  menos de 5 segundos desde que abre la web, sin instrucciones.
- **SC-002**: El 100 % de los sudokus generados (en una muestra de al menos 1.000) tienen
  exactamente una solución.
- **SC-003**: Un sudoku nuevo aparece en menos de 1 segundo en un móvil de gama media.
- **SC-004**: Cada número se introduce con un máximo de dos toques y la respuesta visual se
  percibe como inmediata (menos de 0,1 s).
- **SC-005**: El tablero y el teclado numérico se ven completos y sin scroll en pantallas
  desde 360×640 en vertical, y se pueden usar también en horizontal.
- **SC-006**: En pruebas con usuarios, al menos el 90 % de los participantes completa un
  sudoku Fácil en su primer intento en un móvil sin cometer toques erróneos involuntarios
  (toques que caen en una celda o tecla distinta a la que querían).
- **SC-007**: Tras una recarga o un cierre del navegador, el 100 % de las partidas en curso
  se restauran sin pérdida de progreso.

## Assumptions

- **Público y plataforma**: jugadores individuales en móviles y tabletas con navegador
  moderno; el escritorio con ratón o teclado se admite como uso secundario.
- **Idioma**: la interfaz está en español.
- **Rangos de dificultad**: se aproximan por el número de pistas iniciales: Fácil 36-45,
  Medio 30-35 y Difícil 24-29. La primera partida usa el nivel Medio, o el último nivel
  elegido si ya se jugó antes.
- **Errores**: se señalan solo los conflictos con las reglas (repeticiones), no los números
  que no coinciden con la solución, para no revelar la respuesta.
- **Fuera de alcance en esta versión**: cuentas de usuario, rankings, compartir partidas,
  pistas automáticas o "resolver por mí", variantes distintas del 9×9 clásico,
  historial y estadísticas de partidas, e instalación como aplicación o apertura sin conexión.
- **Restricciones técnicas**: el frontal se desarrolla en TypeScript, idealmente con React.
  Esta versión no tiene backend: la generación, la validación y la persistencia ocurren en el
  dispositivo. Si en el futuro se necesita un backend, MUST desarrollarse en Python.
- **Publicación**: en esta versión la web solo se ejecuta en local; la publicación queda fuera
  de alcance, aunque el resultado MUST poder servirse como sitio estático (constitución).
  La verificación táctil se hace en local con emulación táctil del navegador o abriendo la web
  desde un móvil en la misma red.
- **Persistencia**: solo se guarda una partida en curso por dispositivo y navegador; borrar
  los datos del navegador la elimina.
