import { expect, test, type Page } from '@playwright/test'
import { openGame } from './helpers'

const RANGES = { Fácil: [36, 45], Medio: [30, 35], Difícil: [24, 29] } as const

async function cluesShown(page: Page) {
  return page
    .getByRole('grid', { name: 'Tablero de sudoku' })
    .getByRole('button', { name: /pista \d/ })
    .count()
}

for (const [level, [min, max]] of Object.entries(RANGES)) {
  test(`nueva partida ${level}: pistas en rango y nivel visible`, async ({ page }) => {
    await openGame(page, '')
    await page.getByRole('button', { name: 'Nueva partida' }).tap()
    const dialog = page.getByRole('dialog', { name: 'Nueva partida' })
    for (const name of ['Fácil', 'Medio', 'Difícil', 'Cancelar'])
      await expect(dialog.getByRole('button', { name })).toBeVisible()
    await dialog.getByRole('button', { name: level }).tap()
    await expect(dialog).toBeHidden()
    await expect(page.locator('.status:visible .status-level')).toHaveText(level)
    const clues = await cluesShown(page)
    expect(clues).toBeGreaterThanOrEqual(min)
    expect(clues).toBeLessThanOrEqual(max)
  })
}

test('Cancelar mantiene la partida', async ({ page }) => {
  const board = await openGame(page)
  const before = await board.getByRole('button').first().getAttribute('aria-label')
  await page.getByRole('button', { name: 'Nueva partida' }).tap()
  await page.getByRole('button', { name: 'Cancelar' }).tap()
  await expect(board.getByRole('button').first()).toHaveAttribute('aria-label', before!)
})

test('recuerda el último nivel elegido', async ({ page }) => {
  await openGame(page, '')
  await page.getByRole('button', { name: 'Nueva partida' }).tap()
  await page.getByRole('button', { name: 'Difícil' }).tap()
  await expect(page.locator('.status:visible .status-level')).toHaveText('Difícil')
  await page.evaluate(() => localStorage.removeItem('sudokus-web:v1:game'))
  await page.reload()
  await expect(page.locator('.status:visible .status-level')).toHaveText('Difícil')
})
