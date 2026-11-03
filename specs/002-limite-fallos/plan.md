# Implementation Plan: Límite de fallos por partida

**Branch**: `002-limite-fallos` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-limite-fallos/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

La partida cuenta los fallos: números definitivos que no coinciden con la solución. Se ven en
la barra de estado como "Fallos: N/3" y cada celda incorrecta se marca al momento. Al tercer
fallo la partida pasa a un nuevo estado `lost`. Se detiene el cronómetro, se bloquea el
tablero y un diálogo ofrece "Nueva partida" o "Reintentar" (el mismo sudoku desde cero). La
victoria muestra los fallos cometidos.

**Enfoque técnico**: es una ampliación del dominio puro existente.
- `Game` gana el campo `mistakes` y el estado `lost`.
- `gameReducer` cuenta los fallos al poner un número y añade la acción `retry`.
- `derive` calcula las celdas incorrectas (`wrong`) comparando con `puzzle.solution`, que ya
  se guarda.
- El esquema guardado sigue siendo `schema: 1`, con un campo opcional `mistakes`, así que las
  partidas antiguas se restauran con 0 fallos.
- La interfaz suma un contador, un estado visual de celda y un diálogo de derrota.

Sin dependencias nuevas. Decisiones en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (`strict`, ~7.0 según `frontend/package.json`), Node 24 LTS
para el tooling

**Primary Dependencies**: React 19, Vite. Sin dependencias nuevas.

**Storage**: `localStorage`, clave `sudokus-web:v1:game`. Se amplía `StoredGame` sin cambiar
de versión ([contracts/storage-schema.md](./contracts/storage-schema.md)).

**Testing**: Vitest para el dominio y la serialización en Node, React Testing Library para los
componentes y Playwright con emulación táctil y axe para el flujo completo.

**Target Platform**: la de la funcionalidad 001: Safari iOS y Chrome Android (dos últimas
versiones) y escritorio equivalente, publicado en GitHub Pages.

**Project Type**: aplicación web de frontal estático (SPA), sin backend.

**Performance Goals**: contador y marca de fallo en menos de 100 ms tras el toque (SC-002).
Comparar 81 celdas con la solución es O(81), un coste despreciable.

**Constraints**:
- Sin scroll desde 360×640: el contador cabe en la barra de estado existente.
- WCAG 2.1 AA.
- El fallo no se puede señalar solo con color.
- Nada sale del dispositivo.

**Scale/Scope**: 1 campo nuevo en la partida, 1 estado y 1 acción nuevos, 1 diálogo nuevo y
2 componentes modificados (barra de estado y celda).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento en el diseño | Estado |
|-----------|---------------------------|--------|
| **I. Táctil primero** | Sin interacciones nuevas en el tablero: el número se sigue poniendo con dos toques. Los botones "Nueva partida" y "Reintentar" del diálogo miden ≥ 44 px. El contador es solo texto y cabe en la barra de estado sin scroll a 360×640. | ✅ |
| **II. Solución única** | El fallo se mide contra `puzzle.solution`, que es la única solución verificada por el generador. Al reintentar se reutiliza el mismo puzle, sin regenerarlo. La victoria sigue basándose en las reglas. | ✅ |
| **III. Test-First** | Todo el cambio de reglas (contar fallos, estado `lost`, `retry`, `wrong`, serialización) vive en `src/domain/` y se prueba en Node antes de implementarlo. El flujo de 3 fallos tiene prueba e2e. | ✅ |
| **IV. Cliente, sin backend** | Todo ocurre en el dispositivo. Sin dependencias nuevas. El contador se guarda en local con la partida. Sin estadísticas ni historial (YAGNI). | ✅ |
| **V. Rendimiento y accesibilidad** | Cálculo O(81) por jugada. La celda incorrecta se marca con texto rojo sobre fondo de conflicto (≥ 4,5:1 también seleccionada), tachado y "incorrecto" en su nombre accesible. El contador tiene nombre accesible y avisa con `aria-live`. Contraste AA en claro y oscuro, comprobado con axe. | ✅ |
| **Restricciones técnicas** | Sitio estático. Textos nuevos en `src/i18n/es.ts`. | ✅ |
| **Flujo de desarrollo** | Este Constitution Check. Verificación táctil a 360 px en [quickstart.md](./quickstart.md). | ✅ |

**Resultado pre-research**: PASS (evaluado contra la constitución v1.0.1).

**Re-evaluación post-diseño**: PASS. La única regla de producto que cambia es la suposición
"Errores" de la funcionalidad 001: ahora sí se indica que un número no va en una celda. Ese
cambio viene de la spec y su aclaración, y no contradice ningún principio de la constitución.

## Project Structure

### Documentation (this feature)

```text
specs/002-limite-fallos/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones
├── data-model.md        # Fase 1: cambios en Game, transiciones y validación
├── quickstart.md        # Fase 1: guía de validación
├── contracts/
│   ├── domain-api.md    # Cambios en la API del dominio
│   ├── storage-schema.md# Ampliación de StoredGame
│   └── ui-contract.md   # Contador, celda incorrecta y diálogos
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

Solo los archivos que cambian o se crean:

```text
frontend/
├── src/
│   ├── domain/
│   │   ├── types.ts             # GameStatus + 'lost'; Game.mistakes; acción 'retry'; MAX_MISTAKES
│   │   ├── game.ts              # setDigit cuenta fallos y pierde a 3; retry; derive().wrong
│   │   └── serialization.ts     # mistakes opcional (0..3) y status 'lost', con validación cruzada
│   ├── state/
│   │   └── GameProvider.tsx     # comprobar: restaurar 'lost' con el cronómetro parado
│   ├── components/
│   │   ├── StatusBar.tsx        # "Fallos: N/3"
│   │   ├── Cell.tsx             # clase y nombre accesible "incorrecto"
│   │   ├── Board.tsx            # pasa wrong a Cell
│   │   └── dialogs/
│   │       ├── LostDialog.tsx   # NUEVO: "Nueva partida" y "Reintentar"
│   │       └── WinDialog.tsx    # muestra los fallos
│   ├── App.tsx                  # muestra LostDialog cuando status === 'lost'
│   ├── i18n/es.ts               # textos nuevos
│   └── styles/{tokens,app}.css  # estilo .cell.wrong y contador
└── tests/
    ├── unit/game-mistakes.test.ts     # NUEVO
    ├── unit/serialization.test.ts     # ampliado
    ├── component/board.test.tsx       # ampliado (celda incorrecta)
    └── e2e/mistakes.spec.ts           # NUEVO
```

**Structure Decision**: se mantiene el proyecto único `frontend/` de la funcionalidad 001. La
lógica nueva va en `domain/`, que es puro (constitución III), y la interfaz solo dibuja el
estado.

## Complexity Tracking

Sin violaciones de la constitución.
