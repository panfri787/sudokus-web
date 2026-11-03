// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameView } from '../../src/App'
import { newGame, type CellValue, type Sudoku } from '../../src/domain'
import { GameProvider } from '../../src/state/GameProvider'
import { FIRST_EMPTY, SUDOKU } from '../unit/fixtures'

const SECOND_EMPTY = SUDOKU.givens.findIndex((v, i) => v === 0 && i > FIRST_EMPTY)
/** Un dígito que no coincide con la solución de la celda. */
const wrongDigit = (i: number) => (SUDOKU.solution[i] === 1 ? 2 : 1)

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
      'Fila 1, columna 3, valor 5, en conflicto, incorrecto',
    )
    expect(cellButtons(board)[0]).toHaveAccessibleName('Fila 1, columna 1, pista 5, en conflicto')
  })

  it('desactiva la tecla de un dígito colocado 9 veces', () => {
    // Sudoku de prueba con todos los 1 de la solución como pistas.
    const givens = SUDOKU.givens.map((v, i) => (SUDOKU.solution[i] === 1 ? 1 : v)) as CellValue[]
    renderGame({ ...SUDOKU, givens })
    const pad = screen.getByRole('group', { name: 'Números' })
    expect(within(pad).getByRole('button', { name: /^1/ })).toHaveAttribute('aria-disabled', 'true')
    expect(within(pad).getByRole('button', { name: '2' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('muestra el contador de fallos y marca la celda incorrecta', async () => {
    const { user, board } = renderGame()
    expect(screen.getAllByText('Fallos: 0/3').length).toBeGreaterThan(0)
    await user.click(cellButtons(board)[FIRST_EMPTY]!)
    await user.click(screen.getByRole('button', { name: String(wrongDigit(FIRST_EMPTY)) }))
    expect(screen.getAllByText('Fallos: 1/3').length).toBeGreaterThan(0)
    expect(cellButtons(board)[FIRST_EMPTY]).toHaveAccessibleName(/, incorrecto$/)
    expect(cellButtons(board)[FIRST_EMPTY]).toHaveClass('wrong')

    await user.click(cellButtons(board)[SECOND_EMPTY]!)
    await user.click(screen.getByRole('button', { name: String(SUDOKU.solution[SECOND_EMPTY]) }))
    expect(screen.getAllByText('Fallos: 1/3').length).toBeGreaterThan(0)
    expect(cellButtons(board)[SECOND_EMPTY]).not.toHaveAccessibleName(/incorrecto/)
  })

  it('la victoria muestra los fallos y solo ofrece "Nueva partida" (FR-009)', async () => {
    const values = SUDOKU.solution.map((v, i) => (i === FIRST_EMPTY ? 0 : v)) as CellValue[]
    render(
      <GameProvider initialGame={{ ...newGame(SUDOKU, Date.now()), values, mistakes: 1 }}>
        <GameView />
      </GameProvider>,
    )
    const board = screen.getByRole('grid', { name: 'Tablero de sudoku' })
    const user = userEvent.setup()
    await user.click(cellButtons(board)[FIRST_EMPTY]!)
    await user.click(screen.getByRole('button', { name: String(SUDOKU.solution[FIRST_EMPTY]) }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('¡Resuelto!')
    expect(dialog).toHaveTextContent('Fallos: 1/3')
    expect(within(dialog).getByRole('button', { name: 'Nueva partida' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'Reintentar' })).toBeNull()
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
