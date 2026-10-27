import { expect, test } from '@playwright/test'
import { cell, emptyCells, key, openGame, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)
const a = empties[0]!
const sameRow = empties.find((i) => i !== a && Math.floor(i / 9) === Math.floor(a / 9))!

test('notas, borrado automático y deshacer', async ({ page }) => {
  const board = await openGame(page)
  const notes = page.getByRole('button', { name: 'Notas' })
  const undo = page.getByRole('button', { name: 'Deshacer' })
  await expect(undo).toBeDisabled()

  await notes.tap()
  await expect(notes).toHaveAttribute('aria-pressed', 'true')
  await cell(board, a).tap()
  await key(page, 1).tap()
  await key(page, 3).tap()
  await expect(cell(board, a)).toHaveAccessibleName(/notas 1, 3$/)

  await notes.tap()
  await cell(board, sameRow).tap()
  await key(page, 3).tap()
  await expect(cell(board, a)).toHaveAccessibleName(/notas 1$/)

  await undo.tap()
  await expect(cell(board, a)).toHaveAccessibleName(/notas 1, 3$/)
  await undo.tap()
  await undo.tap()
  await expect(cell(board, a)).toHaveAccessibleName(/vacía$/)
  await expect(undo).toBeDisabled()
})
