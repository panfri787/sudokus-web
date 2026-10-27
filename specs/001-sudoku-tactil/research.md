# Research: Sudoku aleatorio táctil

**Feature**: `001-sudoku-tactil` | **Date**: 2026-10-27 | **Plan**: [plan.md](./plan.md)

Cada apartado resuelve una incógnita del Technical Context o una decisión de diseño con
impacto en la constitución.

## R1. Stack del frontal

- **Decision**: TypeScript (modo `strict`) + React 19, empaquetado con Vite. Node 24 LTS y npm
  como gestor (ya instalados en el entorno).
- **Rationale**: impuesto por la aclaración de la especificación (TypeScript, idealmente
  React). Vite genera un sitio estático sin configuración de servidor (constitución IV),
  soporta Web Workers con `new Worker(new URL(...), { type: 'module' })` de serie y tiene
  integración directa con Vitest.
- **Alternatives considered**: Next.js (orientado a SSR/servidor, contrario a IV); Create React
  App (abandonado); Preact (más ligero, pero la especificación pide React y la diferencia de
  tamaño no afecta a los objetivos de rendimiento).

## R2. Gestión de estado

- **Decision**: lógica de partida como funciones puras en `src/domain/` (reducer
  `gameReducer(state, action)`), conectada a React con `useReducer` y un contexto. Sin
  librerías de estado.
- **Rationale**: la constitución III exige un dominio aislado y testeable sin navegador; un
  reducer puro se prueba con Vitest en Node. Deshacer se implementa sobre el mismo reducer.
  Constitución IV desaconseja dependencias no justificadas.
- **Alternatives considered**: Redux Toolkit / Zustand (añaden dependencia sin beneficio para
  un único estado local); estado repartido en componentes (dificulta deshacer y persistir).

## R3. Algoritmo de generación con solución única

- **Decision**:
  1. Generar una solución completa rellenando el tablero por backtracking con orden de
     candidatos aleatorio.
  2. Recorrer las 81 celdas en orden aleatorio, quitando cada pista y comprobando con un
     resolvedor que cuenta soluciones **hasta 2** (corta al encontrar la segunda); si deja de
     ser única, se restaura.
  3. Parar al alcanzar el número de pistas objetivo, elegido al azar dentro del rango del
     nivel (Fácil 36-45, Medio 30-35, Difícil 24-29).
  4. Si tras recorrer todas las celdas quedan más pistas que el máximo del rango (posible en
     Difícil), reintentar con una nueva solución hasta quedar dentro. Nunca se devuelve un
     puzle fuera de rango (US3, escenario 2). Tope de seguridad de 200 intentos: si se agota,
     el generador lanza un error y el hilo principal reintenta con otra semilla. La prueba de
     muestra mide el número medio de intentos por nivel.
- **Resolvedor**: backtracking con máscaras de bits por fila/columna/caja y heurística de
  "celda con menos candidatos primero" (MRV). Resuelve un 9×9 típico en microsegundos-
  milisegundos, suficiente para las ~81 comprobaciones de unicidad.
- **Rationale**: es el método estándar y garantiza por construcción FR-001 (unicidad
  verificada). El conteo acotado a 2 evita explorar todo el espacio.
- **Alternatives considered**: banco de puzles pregenerados (contrario a "generación
  aleatoria" de la constitución II); Dancing Links/Algorithm X (más rápido pero más complejo,
  innecesario para el objetivo de < 1 s); dificultad por técnicas lógicas necesarias (más
  preciso, pero la especificación fija el criterio por número de pistas; queda como mejora).

## R4. Generación fuera del hilo principal

- **Decision**: la generación se ejecuta en un Web Worker de módulo (`generator.worker.ts`)
  que importa el mismo código de `src/domain/`. Tras mostrar un puzle, el worker pregenera en
  segundo plano el siguiente del mismo nivel, de modo que "Nueva partida" suele ser
  instantánea.
- **Rationale**: constitución V (si puede bloquear la interfaz, MUST ir fuera del hilo
  principal) y SC-003 (< 1 s). En Difícil, los reintentos pueden superar los 100 ms en móviles
  de gama media; el worker mantiene la interfaz fluida y permite mostrar un indicador de carga.
- **Alternatives considered**: generar en el hilo principal con `setTimeout` troceado (más
  complejo y menos fiable); solo pregenerar sin worker (sigue bloqueando).

## R5. Aleatoriedad reproducible

- **Decision**: PRNG pequeño y determinista (mulberry32) con semilla de 32 bits obtenida de
  `crypto.getRandomValues`. Todas las funciones del generador reciben la función aleatoria
  como parámetro.
- **Rationale**: permite pruebas deterministas (misma semilla → mismo puzle) y muestras de
  1.000 puzles reproducibles para SC-002, sin perder aleatoriedad real en producción.
- **Alternatives considered**: `Math.random` directo (no reproducible en pruebas).

## R6. Interacción táctil

- **Decision**:
  - Celdas y teclas como `<button>` nativos; se usan Pointer Events (`onPointerDown` para
    feedback inmediato y `onClick` para la acción) sin listeners de hover.
  - Ningún `<input>` de texto: el teclado del sistema nunca se abre (FR-017).
  - `touch-action: manipulation` en el área de juego (elimina zoom por doble toque y el
    retraso de 300 ms); `user-select: none` y `-webkit-tap-highlight-color: transparent`.
  - Meta viewport `width=device-width, initial-scale=1, viewport-fit=cover`.
  - Layout con CSS Grid y unidades `dvh`/`dvw`: el tablero se dimensiona con
    `min(100dvw - márgenes, alto disponible)` para caber sin scroll desde 360×640; en
    horizontal, teclado a la derecha del tablero.
  - Teclas y botones de 44×44 px como mínimo. Las celdas ocupan todo el ancho disponible con
    márgenes laterales de 8 px en pantallas estrechas: en 360 px cada celda mide ~38 px
    (mínimo garantizado 36 px). La celda seleccionada se resalta con fuerza para que un toque
    errado se detecte al momento (SC-006 lo valida con usuarios).
- **Rationale**: cumple FR-017 y la constitución I (v1.0.1: teclas y botones ≥ 44 px, celdas
  ≥ 36 px con selección inequívoca) con la plataforma estándar. 9 celdas de 44 px (396 px) no
  cabrían en la pantalla mínima de 360 px.
- **Alternatives considered**: librerías de gestos (innecesarias: no hay gestos, solo toques);
  zoom o lupa sobre el tablero (añade un paso y rompe "dos toques por número").

## R7. Persistencia local

- **Decision**: `localStorage` bajo la clave `sudokus-web:v1:game` (partida) y
  `sudokus-web:v1:prefs` (último nivel). Se guarda en cada acción, con escritura agrupada
  (como mucho una vez cada 300 ms) y forzada en `visibilitychange`/`pagehide`. Al cargar, los
  datos se validan contra el esquema; si son ilegibles o inválidos, se descartan y se empieza
  partida nueva (caso límite de la especificación).
- **Rationale**: suficiente para una sola partida (< 10 KB), síncrono y disponible en todos los
  navegadores objetivo. Es almacenamiento local, no cookies, y nada sale del dispositivo
  (FR-019).
- **Alternatives considered**: IndexedDB (asíncrono y más complejo, sin necesidad de volumen);
  cookies (prohibidas por FR-019).

## R8. Cronómetro

- **Decision**: se guarda `elapsedMs` acumulado más la marca `runningSince` cuando está en
  marcha. Se pausa con `document.visibilityState === 'hidden'` y al completar. La pantalla se
  refresca una vez por segundo.
- **Rationale**: FR-008 y restauración exacta tras recarga (SC-007) sin depender de intervalos.

## R9. Estrategia de pruebas

- **Decision**:
  - **Vitest** para el dominio (generador, resolvedor, reglas, reducer, deshacer, serialización)
    con pruebas escritas antes del código (constitución III).
  - **React Testing Library** + Vitest (`jsdom`) para componentes.
  - **Playwright** para flujos de extremo a extremo con emulación táctil (`hasTouch`,
    `isMobile`) en dispositivos `Pixel 7` y `iPhone 13`, más un viewport fijo de 360×640;
    incluye comprobación de "sin scroll" y **@axe-core/playwright** para contraste WCAG AA.
  - Prueba de muestra: 1.000 puzles generados con semillas fijas, todos con solución única y
    pistas dentro del rango (SC-002); se ejecuta en un script aparte por su duración.
- **Rationale**: cubre los requisitos MUST/SHOULD de la constitución III y V y el flujo de
  desarrollo (verificación táctil en emulación).
- **Alternatives considered**: Jest (más lento y peor integración con Vite); Cypress (soporte de
  emulación táctil más limitado que Playwright).

## R10. Calidad de código

- **Decision**: ESLint (configuración plana con `typescript-eslint` y reglas de hooks de React)
  y Prettier. `tsc --noEmit` en la verificación.
- **Rationale**: estándar del ecosistema; bajo coste.

## R11. Ubicación del código y backend futuro

- **Decision**: el frontal vive en `frontend/`. No se crea `backend/` en esta versión; si se
  necesita en el futuro, irá en `backend/` con Python (aclaración de la especificación).
- **Rationale**: deja el repositorio preparado para un monorepo sin introducir nada que no se
  use (YAGNI).
