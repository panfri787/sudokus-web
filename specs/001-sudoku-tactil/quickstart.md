# Quickstart: validar Sudoku aleatorio táctil

**Feature**: `001-sudoku-tactil` | **Plan**: [plan.md](./plan.md)

Guía para comprobar de extremo a extremo que la funcionalidad cumple la especificación. Los
comandos asumen que la implementación ya existe en `frontend/`.

## Requisitos previos

- Node 24 LTS y npm 11 (`node --version`, `npm --version`).
- Navegadores de Playwright: `npx playwright install --with-deps chromium webkit` (una vez).
- Opcional: un móvil en la misma red Wi-Fi que el equipo.

## Puesta en marcha

```bash
cd frontend
npm install
npm run dev            # servidor local de desarrollo
npm run dev -- --host  # igual, accesible desde el móvil en la red local
```

## Verificación automática

| Comando | Qué valida | Resultado esperado |
|---------|------------|--------------------|
| `npm run typecheck` | Tipos estrictos | Sin errores |
| `npm run lint` | ESLint | Sin errores |
| `npm test` | Dominio y componentes (Vitest) | Todo en verde |
| `npm run test:sample` | 1.000 puzles por nivel con semillas fijas: solución única y pistas en rango; tiempo medio y p95 por nivel | 100 % únicos (SC-002) y 100 % dentro del rango de pistas; p95 < 1 s con CPU ×4 más lenta (SC-003) |
| `npm run test:e2e` | Playwright en Pixel 7, iPhone 13 y 360×640 con emulación táctil (desarrollo) y sobre el build de producción (layout y privacidad); contraste con axe; respuesta al toque < 100 ms | Todo en verde |
| `npm run build && npm run preview` | Sitio estático en `frontend/dist/` | Se sirve sin backend |

## Escenarios manuales

Hacerlos en el móvil real (`--host`) o con la emulación táctil de las herramientas del navegador
a 360×640.

| # | Pasos | Resultado esperado | Referencia |
|---|-------|--------------------|------------|
| 1 | Abrir la web | Sudoku listo en < 1 s; nivel Medio; cronómetro en marcha | US1-1, SC-001, SC-003 |
| 2 | Tocar una celda vacía y luego "5" | El 5 aparece; nunca se abre el teclado del sistema | US1-2, FR-017 |
| 3 | Tocar una pista e intentar cambiarla | No cambia | US1-3 |
| 4 | Poner un número repetido en la fila | Ambas celdas en conflicto, con subrayado además del color | US1-5, FR-006 |
| 5 | Doble toque rápido sobre el tablero | Sin zoom de página, sin número duplicado | Casos límite |
| 6 | Activar "Notas", tocar 1 y 3 en una celda | Notas pequeñas 1 y 3 | US2-1 |
| 7 | Poner un 3 definitivo en la misma fila | Desaparece la nota 3 de esa fila | US2-3, FR-011 |
| 8 | "Deshacer" dos veces | Vuelve el estado anterior, incluidas las notas | US2-4 |
| 9 | Recargar la página | Mismo tablero, notas, nivel y tiempo | US4-1, SC-007 |
| 10 | Desactivar la red y pulsar "Nueva partida" → "Difícil" | Se genera un puzle sin conexión, 24-29 pistas | FR-018, US3-2 |
| 11 | Girar el móvil | El teclado pasa al lateral; se conserva la selección | Casos límite |
| 12 | Completar un puzle Fácil | "¡Resuelto!" con el tiempo; "Nueva partida" disponible | US1-6, FR-007 |
| 13 | Comprobar sin scroll a 360×640 | Tablero, botones y teclado visibles sin desplazar | SC-005 |
| 14 | Activar modo oscuro del sistema | Interfaz oscura legible | Constitución V |

## Comprobación de privacidad

Con las herramientas de red del navegador abiertas, jugar una partida completa: no debe haber
peticiones posteriores a la carga inicial, y en Almacenamiento solo deben aparecer las claves
`sudokus-web:v1:*` de `localStorage`, sin cookies (FR-019).
