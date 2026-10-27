import { expect, test, type Page } from '@playwright/test'
import { cell, emptyCells, key, openGame, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const target = emptyCells(sudoku)[0]!

async function expectFits(page: Page) {
  const { sh, sw, ih, iw } = await page.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    sw: document.documentElement.scrollWidth,
    ih: innerHeight,
    iw: innerWidth,
  }))
  expect(sh).toBeLessThanOrEqual(ih)
  expect(sw).toBeLessThanOrEqual(iw)

  const board = page.getByRole('grid', { name: 'Tablero de sudoku' })
  for (const box of await board
    .getByRole('button')
    .evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]),
    )) {
    expect(box[0]).toBeGreaterThanOrEqual(36)
    expect(box[1]).toBeGreaterThanOrEqual(36)
  }
  const others = page.locator('.side:visible button, .toolbar:visible button')
  for (const [w, h] of await others.evaluateAll((els) =>
    els.map((e) => [e.getBoundingClientRect().width, e.getBoundingClientRect().height]),
  )) {
    expect(w).toBeGreaterThanOrEqual(44)
    expect(h).toBeGreaterThanOrEqual(44)
  }
}

test('vertical 360×640: sin scroll y tamaños táctiles', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await openGame(page)
  await expectFits(page)
  const board = page.getByRole('grid', { name: 'Tablero de sudoku' })
  expect(await board.evaluate((e) => getComputedStyle(e).touchAction)).toBe('manipulation')
})

test('horizontal 640×360: sin scroll, controles a la derecha y selección conservada', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  const board = await openGame(page)
  await cell(board, target).tap()
  await page.setViewportSize({ width: 640, height: 360 })
  await expectFits(page)
  const boardBox = (await board.boundingBox())!
  for (const loc of [
    page.locator('.status:visible'),
    page.locator('.toolbar'),
    page.getByRole('group', { name: 'Números' }),
  ]) {
    const box = (await loc.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(boardBox.x + boardBox.width)
  }
  await expect(cell(board, target)).toHaveAttribute('aria-current', 'true')
})

test('escritorio 1280×800: tablero de 560 px como máximo', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const board = await openGame(page)
  const box = (await board.boundingBox())!
  expect(box.width).toBeLessThanOrEqual(560)
  expect(box.height).toBeLessThanOrEqual(560)
})

test('respuesta al toque < 100 ms con CPU ×4 (SC-004)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'La limitación de CPU solo existe en Chromium')
  await page.setViewportSize({ width: 360, height: 640 })
  const board = await openGame(page)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  /** Mide desde `pointerdown` hasta el primer frame en que se cumple `done`. */
  const measure = (selector: string, done: string) =>
    page.evaluate(
      ([sel, cond]) =>
        new Promise<number>((resolve) => {
          const el = document.querySelector(sel)!
          el.addEventListener(
            'pointerdown',
            () => {
              const t0 = performance.now()
              const check = new Function(`return (${cond})`) as () => boolean
              const loop = () =>
                check() ? resolve(performance.now() - t0) : requestAnimationFrame(loop)
              requestAnimationFrame(loop)
            },
            { once: true, capture: true },
          )
        }),
      [selector, done] as const,
    )

  const cellSel = `.board .board-cell:nth-child(${(target % 9) + 1})`
  const rowSel = `.board .board-row:nth-child(${Math.floor(target / 9) + 1}) `
  const selectLatency = measure(
    rowSel + cellSel + ' .cell',
    `document.querySelector('${rowSel + cellSel} .cell').classList.contains('selected')`,
  )
  await cell(board, target).tap()
  expect(await selectLatency).toBeLessThan(100)

  const d = sudoku.solution[target]!
  const inputLatency = measure(
    `.numpad .key:nth-child(${d})`,
    `document.querySelector('${rowSel + cellSel} .cell').textContent === '${d}'`,
  )
  await key(page, d).tap()
  expect(await inputLatency).toBeLessThan(100)
})
