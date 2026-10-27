# Sudokus Web

Web para jugar sudokus 9×9 generados al azar, con solución única, pensada para pantallas
táctiles: dos toques por número, notas, deshacer, tres niveles de dificultad y partida guardada
en el dispositivo. Funciona entera en el navegador, sin backend, sin cookies y sin analítica.

## Requisitos

- Node 24 LTS y npm 11

## Uso

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # accesible desde un móvil en la misma red
```

## Verificación

| Comando | Qué hace |
|---------|----------|
| `npm run typecheck` | Tipos estrictos |
| `npm run lint` | oxlint |
| `npm test` | Pruebas del dominio y de componentes (Vitest) |
| `npm run test:sample` | 1.000 sudokus por nivel: unicidad, rango de pistas y tiempos |
| `npm run test:e2e` | Playwright con emulación táctil (Pixel 7, iPhone 13, 360×640 y build) |
| `npm run test:perf` | Respuesta al toque < 100 ms sobre el build, CPU ×4, un solo worker |
| `npm run size` | Build y comprobación del tamaño del bundle (< 150 KB gzip) |
| `npm run build` | Sitio estático en `frontend/dist/` |

Antes de la primera ejecución de `test:e2e`:

```bash
npx playwright install --with-deps chromium webkit
```

Con Node instalado mediante nvm, `sudo` no ve `npx`; usa
`sudo env "PATH=$PATH" npx playwright install-deps chromium webkit`.

## Despliegue

La web se publica en **https://panfri787.github.io/sudokus-web/**.
`.github/workflows/deploy.yml` construye el sitio con `BASE_PATH=/sudokus-web/` y lo despliega en
GitHub Pages en cada push a `main` (también se puede lanzar a mano desde *Actions*). En local y en
las pruebas la web se sirve en la raíz (`/`).

## Integración continua

`.github/workflows/ci.yml` ejecuta tipos, lint, pruebas, tamaño y e2e en cada PR y push a
`main`. Para cumplir la constitución (ningún cambio que rompa pruebas se integra), protege `main`
en GitHub (*Settings → Branches → Branch protection rules*) exigiendo el check **CI / checks**.

## Documentación

Especificación, plan y tareas en [`specs/001-sudoku-tactil/`](specs/001-sudoku-tactil/); principios
del proyecto en [`.specify/memory/constitution.md`](.specify/memory/constitution.md).
