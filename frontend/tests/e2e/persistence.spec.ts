import { expect, test } from '@playwright/test'
import { cell, emptyCells, key, openGame, play, sudokuFor } from './helpers'

const sudoku = sudokuFor()
const empties = emptyCells(sudoku)

const labels = (page: import('@playwright/test').Page) =>
  page
    .getByRole('grid', { name: 'Tablero de sudoku' })
    .getByRole('button')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))

test('recargar conserva tablero, notas, nivel y tiempo', async ({ page }) => {
  const board = await openGame(page)
  await play(page, board, empties[0]!, sudoku.solution[empties[0]!]!)
  await page.getByRole('button', { name: 'Notas', exact: true }).tap()
  await cell(board, empties[1]!).tap()
  await key(page, 2).tap()
  await page.waitForTimeout(1500)
  const before = await labels(page)
  const timeBefore = await page.locator('.status:visible [role=timer]').textContent()

  await page.reload()
  await expect(
    page.getByRole('grid', { name: 'Tablero de sudoku' }).getByRole('button'),
  ).toHaveCount(81)
  expect(await labels(page)).toEqual(before)
  await expect(page.locator('.status:visible .status-level')).toHaveText('Medio')
  const timeAfter = await page.locator('.status:visible [role=timer]').textContent()
  expect(timeAfter! >= timeBefore!).toBe(true)
})

test('una partida terminada ofrece empezar otra', async ({ page }) => {
  const board = await openGame(page)
  for (const i of empties) await play(page, board, i, sudoku.solution[i]!)
  await expect(page.getByRole('heading', { name: '¡Resuelto!' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '¡Resuelto!' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nueva partida' }).last()).toBeVisible()
})

test('datos guardados ilegibles: partida nueva sin error', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('sudokus-web:v1:game', '{roto'))
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.reload()
  await expect(
    page.getByRole('grid', { name: 'Tablero de sudoku' }).getByRole('button'),
  ).toHaveCount(81)
  expect(errors).toEqual([])
})

const wrongDigit = (i: number) => (sudoku.solution[i] === 1 ? 2 : 1)
const counter = (page: import('@playwright/test').Page, n: number) =>
  page.locator('.status:visible .status-mistakes').filter({ hasText: `Fallos: ${n}/3` })

test('recargar conserva los fallos', async ({ page }) => {
  const board = await openGame(page)
  await play(page, board, empties[0]!, wrongDigit(empties[0]!))
  await expect(counter(page, 1)).toBeVisible()
  await page.waitForTimeout(500)
  await page.reload()
  await expect(counter(page, 1)).toBeVisible()
})

test('recargar una partida perdida mantiene la derrota con el tiempo parado', async ({ page }) => {
  const board = await openGame(page)
  for (const i of empties.slice(0, 3)) await play(page, board, i, wrongDigit(i))
  await expect(page.getByRole('heading', { name: 'Sin intentos' })).toBeVisible()
  await page.waitForTimeout(500)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sin intentos' })).toBeVisible()
  const timer = page.locator('.status:visible [role=timer]')
  const t1 = await timer.textContent()
  await page.waitForTimeout(2000)
  expect(await timer.textContent()).toBe(t1)
})

test('recargar tras reintentar restaura la partida reintentada', async ({ page }) => {
  const board = await openGame(page)
  for (const i of empties.slice(0, 3)) await play(page, board, i, wrongDigit(i))
  await page.getByRole('button', { name: 'Reintentar' }).tap()
  const i = empties[0]!
  await play(page, board, i, sudoku.solution[i]!)
  await page.waitForTimeout(500)
  await page.reload()
  await expect(cell(board, i)).toHaveAccessibleName(new RegExp(`valor ${sudoku.solution[i]}$`))
  await expect(counter(page, 0)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sin intentos' })).toHaveCount(0)
})
