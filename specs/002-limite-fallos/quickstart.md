# Quickstart: validar el límite de fallos

**Feature**: `002-limite-fallos` | **Plan**: [plan.md](./plan.md)

Los requisitos previos y la puesta en marcha son los mismos que en el
[quickstart de 001](../001-sudoku-tactil/quickstart.md). Los comandos se ejecutan en
`frontend/`.

## Verificación automática

| Comando | Qué valida | Resultado esperado |
|---------|------------|--------------------|
| `npm run typecheck` | Tipos (`mistakes`, `'lost'`, `retry`) | Sin errores |
| `npm run lint` | oxlint | Sin errores |
| `npm test` | `game-mistakes.test.ts`: contar fallos, `lost` a 3, `retry`, `wrong`, que deshacer/borrar/notas no cambian el contador. `serialization.test.ts`: `mistakes` opcional, `lost` ⇔ 3 | Todo en verde |
| `npm run test:e2e` | `mistakes.spec.ts` con emulación táctil a 360×640 y axe | Todo en verde, sin infracciones de contraste |

## Verificación manual

Abre `npm run dev` con `?seed=12345` para tener un puzle fijo. Para saber qué número es
incorrecto, elige uno que ya esté en la fila de la celda.

| # | Pasos | Resultado esperado | Spec |
|---|-------|--------------------|------|
| 1 | Abrir una partida nueva | La barra de estado muestra "Fallos: 0/3" | US1-1 |
| 2 | Poner un número correcto | El contador no cambia | US1-3 |
| 3 | Poner un número incorrecto | "Fallos: 1/3"; la celda aparece en rojo y tachada | US1-2, FR-003 |
| 4 | Borrar ese número y deshacer | El contador sigue en 1/3 | US1-4 |
| 5 | Modo notas: añadir y quitar notas | El contador no cambia | US1-5 |
| 6 | Recargar la página | "Fallos: 1/3" se mantiene | US3-1 |
| 7 | Cometer 2 fallos más | "Fallos: 3/3"; el cronómetro se para; aparece "Sin intentos" | US2-1 |
| 8 | Tocar celdas, números, Borrar, Deshacer y Notas | El tablero no cambia | US2-2 |
| 9 | Recargar la página | Sigue el diálogo "Sin intentos" | US2-4 |
| 10 | Tocar "Reintentar" | El mismo sudoku, solo con pistas; "Fallos: 0/3", tiempo 00:00, Deshacer desactivado | US2-5 |
| 11 | Volver a perder y tocar "Nueva partida" | Se abre el diálogo de nivel sin confirmación; el sudoku nuevo empieza con 0/3 | US2-3 |
| 12 | Ganar con 1 o 2 fallos | La victoria muestra "Fallos: N/3" y solo "Nueva partida" | FR-009 |
| 13 | Probar 7 y 12 en modo oscuro y en horizontal | Contador y celda incorrecta legibles; sin scroll | FR-009 de 001 |

Antes de dar la funcionalidad por terminada, repite los pasos 3, 7 y 10 en un móvil real o en
emulación táctil a 360 px (constitución, Flujo de desarrollo).

## Compatibilidad con partidas antiguas

1. Con la versión anterior en `main`, deja una partida a medias.
2. Cambia a esta rama y recarga.
3. Resultado esperado: la partida se restaura con "Fallos: 0/3" y se puede seguir jugando
   (US3-2).
