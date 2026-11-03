import { expect, test } from '@playwright/test'
import { cell, emptyCells, key, openGame, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)
const a = empties[0]!
const sameRow = empties.find((i) => i !== a && Math.floor(i / 9) === Math.floor(a / 9))!
// Solo un número correcto limpia las notas de sus pares (002 research R3).
const d = sudoku.solution[sameRow]!
const other = d === 1 ? 2 : 1
const both = [other, d].sort((x, y) => x - y).join(', ')

test('notas, borrado automático y deshacer', async ({ page }) => {
  const board = await openGame(page)
  const notes = page.getByRole('button', { name: 'Notas', exact: true })
  const undo = page.getByRole('button', { name: 'Deshacer' })
  await expect(undo).toBeDisabled()

  await notes.tap()
  await expect(notes).toHaveAttribute('aria-pressed', 'true')
  await cell(board, a).tap()
  await key(page, other).tap()
  await key(page, d).tap()
  await expect(cell(board, a)).toHaveAccessibleName(new RegExp(`notas ${both}$`))

  await notes.tap()
  await cell(board, sameRow).tap()
  await key(page, d).tap()
  await expect(cell(board, a)).toHaveAccessibleName(new RegExp(`notas ${other}$`))

  await undo.tap()
  await expect(cell(board, a)).toHaveAccessibleName(new RegExp(`notas ${both}$`))
  await undo.tap()
  await undo.tap()
  await expect(cell(board, a)).toHaveAccessibleName(/vacía$/)
  await expect(undo).toBeDisabled()
})
