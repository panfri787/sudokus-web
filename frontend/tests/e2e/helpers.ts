import { expect, type Locator, type Page } from '@playwright/test'
import { generateSudoku, type Difficulty, type Sudoku } from '../../src/domain'

export const SEED = 12345

export function sudokuFor(difficulty: Difficulty = 'medium', seed = SEED): Sudoku {
  return generateSudoku(difficulty, seed)
}

export async function openGame(page: Page, query = `?seed=${SEED}`) {
  await page.goto(`/${query}`)
  const board = page.getByRole('grid', { name: 'Tablero de sudoku' })
  await expect(board).toBeVisible()
  await expect(board.getByRole('button')).toHaveCount(81)
  return board
}

export const cell = (board: Locator, i: number) => board.getByRole('button').nth(i)

export const key = (page: Page, d: number) =>
  page.getByRole('group', { name: 'Números' }).getByRole('button', { name: new RegExp(`^${d}`) })

export async function play(page: Page, board: Locator, i: number, d: number) {
  await cell(board, i).tap()
  await key(page, d).tap()
}

export const emptyCells = (s: Sudoku) => s.givens.flatMap((v, i) => (v === 0 ? [i] : []))
