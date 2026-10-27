// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameView } from '../../src/App'
import { newGame, type CellValue, type Sudoku } from '../../src/domain'
import { GameProvider } from '../../src/state/GameProvider'
import { FIRST_EMPTY, SUDOKU } from '../unit/fixtures'

function renderGame(sudoku: Sudoku = SUDOKU) {
  render(
    <GameProvider initialGame={newGame(sudoku, Date.now())}>
      <GameView />
    </GameProvider>,
  )
  return { user: userEvent.setup(), board: screen.getByRole('grid', { name: 'Tablero de sudoku' }) }
}

const cellButtons = (board: HTMLElement) => within(board).getAllByRole('button')

describe('Tablero', () => {
  it('tiene 81 celdas con nombres accesibles', () => {
    const { board } = renderGame()
    const cells = cellButtons(board)
    expect(cells).toHaveLength(81)
    expect(cells[0]).toHaveAccessibleName('Fila 1, columna 1, pista 5')
    expect(cells[FIRST_EMPTY]).toHaveAccessibleName('Fila 1, columna 3, vacía')
  })

  it('una pista no se puede cambiar', async () => {
    const { user, board } = renderGame()
    await user.click(cellButtons(board)[0]!)
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(cellButtons(board)[0]).toHaveAccessibleName('Fila 1, columna 1, pista 5')
  })

  it('celda vacía + número muestra el valor', async () => {
    const { user, board } = renderGame()
    await user.click(cellButtons(board)[FIRST_EMPTY]!)
    await user.click(screen.getByRole('button', { name: '4' }))
    expect(cellButtons(board)[FIRST_EMPTY]).toHaveAccessibleName('Fila 1, columna 3, valor 4')
  })

  it('marca los conflictos en el nombre accesible', async () => {
    const { user, board } = renderGame()
    await user.click(cellButtons(board)[FIRST_EMPTY]!)
    await user.click(screen.getByRole('button', { name: '5' }))
    expect(cellButtons(board)[FIRST_EMPTY]).toHaveAccessibleName(
      'Fila 1, columna 3, valor 5, en conflicto',
    )
    expect(cellButtons(board)[0]).toHaveAccessibleName('Fila 1, columna 1, pista 5, en conflicto')
  })

  it('desactiva la tecla de un dígito colocado 9 veces', () => {
    // Sudoku de prueba con todos los 1 de la solución como pistas.
    const givens = SUDOKU.givens.map((v, i) => (SUDOKU.solution[i] === 1 ? 1 : v)) as CellValue[]
    renderGame({ ...SUDOKU, givens })
    const pad = screen.getByRole('group', { name: 'Números' })
    expect(within(pad).getByRole('button', { name: /^1/ })).toHaveAttribute('aria-disabled', 'true')
    expect(within(pad).getByRole('button', { name: '2' })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('no hay campos de texto (nunca se abre el teclado del sistema)', () => {
    const { container } = render(
      <GameProvider initialGame={newGame(SUDOKU, Date.now())}>
        <GameView />
      </GameProvider>,
    )
    expect(container.querySelectorAll('input, textarea, [contenteditable]')).toHaveLength(0)
  })
})
