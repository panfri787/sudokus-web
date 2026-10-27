import { expect, test } from '@playwright/test'
import { cell, emptyCells, openGame, play, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)

test('el tablero aparece en menos de 1 s', async ({ page }) => {
  const t0 = Date.now()
  await openGame(page)
  expect(Date.now() - t0).toBeLessThan(1000 + 500 /* margen de navegación */)
})

test('celda vacía + número muestra el valor', async ({ page }) => {
  const board = await openGame(page)
  const i = empties[0]!
  await play(page, board, i, sudoku.solution[i]!)
  await expect(cell(board, i)).toHaveAccessibleName(new RegExp(`valor ${sudoku.solution[i]}$`))
})

test('un número repetido marca conflicto', async ({ page }) => {
  const board = await openGame(page)
  const i = empties[0]!
  const row = Math.floor(i / 9)
  const givenInRow = sudoku.givens.find((v, j) => v !== 0 && Math.floor(j / 9) === row)!
  await play(page, board, i, givenInRow)
  await expect(cell(board, i)).toHaveAccessibleName(/en conflicto$/)
})

test('completar el sudoku muestra la victoria', async ({ page }) => {
  const board = await openGame(page)
  for (const i of empties) await play(page, board, i, sudoku.solution[i]!)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: '¡Resuelto!' })).toBeVisible()
  await expect(dialog).toContainText(/Tiempo: \d{2}:\d{2}/)
})

test('nueva partida con progreso pide confirmación y carga otro tablero', async ({ page }) => {
  const board = await openGame(page)
  const i = empties[0]!
  await play(page, board, i, sudoku.solution[i]!)
  const before = await board
    .getByRole('button')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join('|'))
  await page.getByRole('button', { name: 'Nueva partida' }).tap()
  await page.getByRole('button', { name: 'Empezar nueva' }).tap()
  await page.getByRole('button', { name: 'Medio' }).tap()
  await expect
    .poll(() =>
      board
        .getByRole('button')
        .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join('|')),
    )
    .not.toBe(before)
})
