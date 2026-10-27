import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { emptyCells, openGame, play, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)

for (const colorScheme of ['light', 'dark'] as const) {
  test(`sin infracciones WCAG A/AA en esquema ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    const board = await openGame(page)
    // Una celda en conflicto y otra seleccionada.
    const i = empties[0]!
    const row = Math.floor(i / 9)
    const givenInRow = sudoku.givens.find((v, j) => v !== 0 && Math.floor(j / 9) === row)!
    await play(page, board, i, givenInRow)
    await board.getByRole('button').nth(empties[1]!).tap()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
}
