import { expect, test } from '@playwright/test'
import { emptyCells, openGame, play, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)

test('sin peticiones tras la carga, sin cookies y solo claves propias', async ({
  page,
  context,
}) => {
  const board = await openGame(page)
  await page.waitForLoadState('networkidle')
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))

  for (const i of empties.slice(0, 10)) await play(page, board, i, sudoku.solution[i]!)
  await page.getByRole('button', { name: 'Nueva partida' }).tap()
  await page.getByRole('button', { name: 'Empezar nueva' }).tap()
  await page.getByRole('button', { name: 'Fácil' }).tap()
  await expect(page.locator('.status:visible .status-level')).toHaveText('Fácil')

  expect(requests).toEqual([])
  expect(await context.cookies()).toEqual([])
  const keys = await page.evaluate(() => Object.keys(localStorage))
  expect(keys.every((k) => k.startsWith('sudokus-web:v1:'))).toBe(true)
})

test('sin conexión tras cargar, se pueden generar partidas nuevas (FR-018)', async ({
  page,
  context,
}) => {
  await openGame(page, '')
  await page.waitForLoadState('networkidle')
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Nueva partida' }).tap()
  await page.getByRole('button', { name: 'Difícil' }).tap()
  await expect(page.locator('.status:visible .status-level')).toHaveText('Difícil')
  await expect(
    page.getByRole('grid', { name: 'Tablero de sudoku' }).getByRole('button'),
  ).toHaveCount(81)
})
