# Implementation Plan: Sudoku aleatorio táctil

**Branch**: `001-sudoku-tactil` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-sudoku-tactil/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Web estática de una sola página para jugar sudokus 9×9 generados al azar, con solución única,
pensada para pantallas táctiles: dos toques por número, notas, deshacer, tres niveles de
dificultad y partida guardada en el dispositivo. Todo se ejecuta en el navegador (sin backend):
un dominio puro en TypeScript (generador por backtracking con verificación de unicidad,
reglas y reducer de la partida) que corre en un Web Worker para generar, y una interfaz en
React que solo dibuja el estado y despacha acciones. Detalle de decisiones en
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node 24 LTS para el tooling

**Primary Dependencies**: React 19, Vite (build y servidor de desarrollo). Sin librerías de
estado, estilos ni gestos.

**Storage**: `localStorage` en el dispositivo ([contracts/storage-schema.md](./contracts/storage-schema.md)); sin cookies

**Testing**: Vitest (dominio, en Node) + React Testing Library (componentes, `jsdom`) +
Playwright con emulación táctil y @axe-core/playwright (extremo a extremo y contraste)

**Target Platform**: navegadores móviles modernos (Safari iOS y Chrome Android, dos últimas
versiones mayores) y navegadores de escritorio equivalentes; ejecución solo en local en esta
versión

**Project Type**: aplicación web de frontal estático (SPA), sin backend

**Performance Goals**: nuevo sudoku < 1 s en móvil de gama media (p95, emulado con CPU ×4 más
lenta); respuesta visual a un toque < 100 ms; 60 fps en el resaltado

**Constraints**: sin scroll desde 360×640; teclas ≥ 44 px; sin teclado del sistema; funciona sin
conexión una vez cargada; nada sale del dispositivo; WCAG 2.1 AA

**Scale/Scope**: 1 jugador por dispositivo, 1 partida guardada, 1 pantalla con 3 diálogos;
bundle objetivo < 150 KB gzip

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento en el diseño | Estado |
|-----------|---------------------------|--------|
| **I. Táctil primero** | Dos toques por número; `<button>` sin hover; sin `<input>`; `touch-action: manipulation`; layout sin scroll a 360×640; teclas y botones ≥ 44 px. **Celdas ~38 px (mín. 36 px)**, por debajo de 44 px | ⚠️ Desviación justificada (Complexity Tracking) |
| **II. Solución única** | `generateSudoku` verifica unicidad con `countSolutions(…, 2)`; semilla aleatoria por partida; dificultad por número de pistas documentado; victoria por reglas + tablero completo | ✅ |
| **III. Test-First** | Dominio aislado en `src/domain/` y probado en Node antes de implementar; pruebas por regla; prueba de muestra de 1.000 puzles; flujos táctiles en Playwright | ✅ |
| **IV. Cliente, sin backend** | Generación y resolución en el navegador; dependencias mínimas (React, Vite) justificadas en research R1/R2; persistencia local; sin cuentas ni funciones en línea | ✅ |
| **V. Rendimiento y accesibilidad** | Generación en Web Worker con pregeneración; contraste AA verificado con axe; conflictos con subrayado además del color; vertical y horizontal; modo oscuro | ✅ |
| **Restricciones técnicas** | Sitio estático (`vite build`); mobile-first; textos en `src/i18n/es.ts` | ✅ |
| **Flujo de desarrollo** | Este Constitution Check; verificación táctil en emulación y móvil real ([quickstart.md](./quickstart.md)); pruebas en verde antes de integrar | ✅ |

**Resultado pre-research**: PASS con una desviación justificada (principio I, celdas).

**Re-evaluación post-diseño** (tras data-model y contratos): PASS. El diseño no introduce
dependencias nuevas, backend ni datos que salgan del dispositivo. La desviación del principio I
sigue siendo la única, y se recomienda resolverla con una enmienda de la constitución (ver
abajo).

## Project Structure

### Documentation (this feature)

```text
specs/001-sudoku-tactil/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones técnicas
├── data-model.md        # Fase 1: entidades, reglas y transiciones
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   ├── domain-api.md    # API pública del dominio y protocolo del worker
│   ├── storage-schema.md# Formato en localStorage y validación al cargar
│   └── ui-contract.md   # Elementos, nombres accesibles, estados y layout
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── playwright.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── domain/                  # Puro: sin DOM ni React (constitución III)
│   │   ├── types.ts             # Digit, Grid, Sudoku, Game, Move…
│   │   ├── rng.ts               # createRng, randomSeed
│   │   ├── rules.ts             # peers, findConflicts
│   │   ├── solver.ts            # countSolutions, solve
│   │   ├── generator.ts         # generateSudoku, CLUE_RANGES
│   │   ├── game.ts              # newGame, gameReducer, derive
│   │   └── serialization.ts     # StoredGame ⇄ Game, validación
│   ├── workers/
│   │   └── generator.worker.ts
│   ├── state/
│   │   ├── GameProvider.tsx     # useReducer + contexto + timer + visibilidad
│   │   ├── storage.ts           # acceso a localStorage con try/catch
│   │   └── usePuzzleSource.ts   # cliente del worker + pregeneración + respaldo síncrono
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── Cell.tsx
│   │   ├── NumberPad.tsx
│   │   ├── Toolbar.tsx          # Borrar, Notas, Deshacer, Nueva partida
│   │   ├── StatusBar.tsx        # Nivel y cronómetro
│   │   └── dialogs/             # NewGameDialog, ConfirmDialog, WinDialog
│   ├── i18n/
│   │   └── es.ts
│   └── styles/
│       ├── tokens.css           # Colores (claro/oscuro), tamaños
│       └── app.css
└── tests/
    ├── unit/                    # Vitest: domain/*
    ├── component/               # Vitest + Testing Library
    ├── sample/                  # 1.000 puzles por nivel (SC-002, SC-003)
    └── e2e/                     # Playwright con emulación táctil
```

**Structure Decision**: un único proyecto de frontal en `frontend/`, sin `backend/`
(aclaración de la especificación: sin backend en esta versión; Python si se necesita en el
futuro). La separación `domain/` (pura) frente a `state/` y `components/` (React) materializa
la constitución III.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principio I: celdas del tablero de ~38 px (mín. 36 px) en vez de 44×44 px | 9 × 44 px = 396 px, más ancho que la pantalla mínima de 360 px que fija el mismo principio I; ambas reglas no pueden cumplirse a la vez | Scroll horizontal o zoom del tablero (viola "sin scroll" y "dos toques por número"); tablero que no cabe a 360 px (viola el mismo principio I) |

**Enmienda recomendada** (fuera del alcance de este comando): ajustar en la constitución I la
regla a "teclas y botones ≥ 44×44 px; celdas del tablero ≥ 36×36 px" (cambio PATCH/MINOR) con
`/speckit-constitution`, para que el plan deje de necesitar esta justificación.
