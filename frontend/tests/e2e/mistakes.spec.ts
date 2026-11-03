import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { cell, emptyCells, key, openGame, play, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)
/** Un dígito que no coincide con la solución de la celda `i`. */
const wrongDigit = (i: number) => (sudoku.solution[i] === 1 ? 2 : 1)
const a = empties[0]!
const sameRow = empties.find((i) => i !== a && Math.floor(i / 9) === Math.floor(a / 9))!

const counter = (page: Page, n: number) => page.getByText(`Fallos: ${n}/3`).first()

async function noContrastViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
}

async function loseGame(page: Page, board: Locator) {
  for (const i of empties.slice(0, 3)) await play(page, board, i, wrongDigit(i))
  await expect(counter(page, 3)).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('Sin intentos')
}

test('contador, derrota a 3 fallos, reintentar y nueva partida', async ({ page }) => {
  const board = await openGame(page)
  await expect(counter(page, 0)).toBeVisible()

  await loseGame(page, board)
  const dialog = page.getByRole('dialog')
  await noContrastViolations(page)

  await dialog.getByRole('button', { name: 'Reintentar' }).tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(counter(page, 0)).toBeVisible()
  await expect(page.getByRole('timer').first()).toHaveText('00:00')
  for (const i of empties) await expect(cell(board, i)).toHaveAccessibleName(/vacía$/)
  await expect(page.getByRole('button', { name: 'Deshacer' })).toBeDisabled()

  await loseGame(page, board)
  await page.getByRole('dialog').getByRole('button', { name: 'Nueva partida' }).tap()
  const level = page.getByRole('dialog')
  await expect(level.getByRole('button', { name: 'Fácil' })).toBeVisible()
  await expect(level.getByRole('button', { name: 'Empezar nueva' })).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`celda incorrecta con contraste AA (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    const board = await openGame(page)
    await play(page, board, a, wrongDigit(a))
    await expect(cell(board, a)).toHaveAccessibleName(/, incorrecto$/)
    await expect(counter(page, 1)).toBeVisible()
    // Seleccionada justo después del fallo.
    await noContrastViolations(page)
    // Resaltada desde otra celda de su fila.
    await cell(board, sameRow).tap()
    await noContrastViolations(page)
    await expect(key(page, 1)).toBeVisible()
  })
}
