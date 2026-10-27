# Sudokus Web Constitution

## Core Principles

### I. Diseño Táctil Primero (Touch-First)

La interfaz se diseña primero para pantallas táctiles y después se adapta a ratón y teclado.

- Las teclas del teclado numérico y los botones MUST tener un área táctil mínima de
  44×44 px CSS.
- Las celdas del tablero MUST tener un área táctil mínima de 36×36 px CSS (9 celdas de 44 px
  no caben en la pantalla mínima de 360 px), y la celda seleccionada MUST resaltarse de forma
  inequívoca para que un toque errado se detecte al momento.
- Introducir un número MUST requerir como máximo dos toques: seleccionar celda y elegir número.
- La interacción MUST NOT depender de hover, doble clic, clic derecho ni del teclado del
  sistema; el teclado nativo del móvil MUST NOT abrirse al jugar.
- El tablero completo y el teclado numérico MUST caber sin scroll en una pantalla vertical de
  360×640 px CSS.
- Gestos accidentales (zoom por doble toque, scroll al arrastrar sobre el tablero) MUST estar
  desactivados en el área de juego.

**Rationale**: el objetivo central del producto es resolver sudokus "de forma sencilla" en
pantallas táctiles; cualquier fricción táctil invalida la propuesta de valor.

### II. Sudokus Válidos con Solución Única

Cada sudoku generado aleatoriamente MUST ser un tablero 9×9 válido con exactamente una
solución.

- El generador MUST verificar la unicidad de la solución antes de mostrar el puzle.
- La generación MUST ser aleatoria: dos partidas consecutivas MUST NOT mostrar el mismo puzle
  salvo coincidencia estadísticamente despreciable.
- Si se ofrecen niveles de dificultad, MUST definirse con un criterio medible (p. ej. número
  de pistas o técnicas necesarias) documentado en la especificación.
- La validación de jugadas y la detección de victoria MUST basarse en las reglas del sudoku,
  no en heurísticas visuales.

**Rationale**: un sudoku con varias soluciones o sin solución rompe la confianza del jugador y
hace imposible validar su progreso.

### III. Lógica de Juego Probada (Test-First)

El núcleo de dominio (generador, resolvedor, validación de reglas, estado de la partida) MUST
desarrollarse con pruebas escritas antes de la implementación.

- La lógica de dominio MUST estar aislada de la interfaz y ser testeable sin navegador.
- Cada regla (fila, columna, caja 3×3, unicidad de solución) MUST tener pruebas automáticas.
- Ningún cambio que rompa pruebas existentes MUST integrarse.
- Los flujos táctiles principales (seleccionar celda, introducir número, borrar, completar
  partida) SHOULD cubrirse con pruebas de interfaz automatizadas.

**Rationale**: los errores en el generador o la validación son silenciosos y difíciles de
detectar manualmente; las pruebas son la única garantía fiable.

### IV. Simplicidad y Ejecución en el Cliente

La aplicación MUST funcionar completamente en el navegador, sin backend obligatorio.

- Generación y resolución MUST ejecutarse en el cliente.
- Dependencias externas MUST justificarse en el plan de implementación; se prefiere la
  plataforma web estándar.
- El progreso de la partida en curso SHOULD persistir localmente para sobrevivir a recargas.
- Se aplica YAGNI: no se añaden cuentas de usuario, rankings ni funciones en línea salvo que
  una especificación lo exija explícitamente.

**Rationale**: un juego individual no necesita servidor; eliminarlo reduce coste, latencia y
superficie de fallo, y permite uso sin conexión.

### V. Rendimiento y Accesibilidad

- La generación de un nuevo sudoku MUST completarse en menos de 1 segundo en un móvil de gama
  media; si puede bloquear la interfaz, MUST ejecutarse fuera del hilo principal.
- La respuesta visual a un toque MUST ser inferior a 100 ms.
- La interfaz MUST cumplir contraste WCAG 2.1 AA y no transmitir información solo mediante el
  color (p. ej. errores marcados también con forma o icono).
- La aplicación MUST ser utilizable en orientación vertical y horizontal, y SHOULD respetar el
  modo oscuro del sistema.

**Rationale**: la sensación de sencillez depende de una respuesta inmediata y de una interfaz
legible para todos los jugadores.

## Restricciones Técnicas

- Plataforma objetivo: navegadores móviles modernos (Safari iOS y Chrome Android, dos últimas
  versiones mayores) y navegadores de escritorio equivalentes.
- Diseño responsive con enfoque mobile-first.
- La aplicación MUST poder desplegarse como sitio estático.
- El idioma principal de la interfaz es el español; los textos SHOULD centralizarse para
  facilitar una futura traducción.

## Flujo de Desarrollo

- Cada funcionalidad sigue el flujo Spec Kit: especificación → plan → tareas → implementación.
- Cada plan MUST incluir una verificación explícita de cumplimiento de esta constitución
  ("Constitution Check") y justificar cualquier desviación.
- Antes de dar por terminada una funcionalidad MUST verificarse en un dispositivo táctil real
  o en emulación táctil del navegador al ancho mínimo de 360 px.
- Las pruebas automáticas MUST pasar antes de integrar cualquier cambio.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica o convención del proyecto.
- Las enmiendas MUST documentarse en este archivo con un Sync Impact Report, actualizar la
  versión y la fecha de última enmienda.
- Versionado semántico: MAJOR para eliminar o redefinir principios de forma incompatible;
  MINOR para añadir principios o secciones o ampliar materialmente su contenido; PATCH para
  aclaraciones y correcciones de redacción.
- Toda especificación, plan y revisión MUST verificar el cumplimiento de los principios; la
  complejidad añadida MUST justificarse por escrito.

**Version**: 1.0.1 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
