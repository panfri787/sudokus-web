// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameView } from '../../src/App'
import { newGame } from '../../src/domain'
import { GameProvider } from '../../src/state/GameProvider'
import { FIRST_EMPTY, SUDOKU } from '../unit/fixtures'

function setup() {
  render(
    <GameProvider initialGame={newGame(SUDOKU, Date.now())}>
      <GameView />
    </GameProvider>,
  )
  const board = screen.getByRole('grid', { name: 'Tablero de sudoku' })
  const cells = () => within(board).getAllByRole('button')
  return { user: userEvent.setup(), cells }
}

describe('teclado físico', () => {
  it('1-9 introducen, Supr/Retroceso/0 borran', async () => {
    const { user, cells } = setup()
    await user.click(cells()[FIRST_EMPTY]!)
    await user.keyboard('4')
    expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/valor 4$/)
    for (const k of ['{Delete}', '{Backspace}', '0']) {
      await user.keyboard('4')
      await user.keyboard(k)
      expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/vacía$/)
    }
  })

  it('las flechas mueven la selección sin salir del tablero', async () => {
    const { user, cells } = setup()
    await user.click(cells()[0]!)
    await user.keyboard('{ArrowLeft}{ArrowUp}')
    expect(cells()[0]).toHaveAttribute('aria-current', 'true')
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(cells()[10]).toHaveAttribute('aria-current', 'true')
    await user.click(cells()[80]!)
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(cells()[80]).toHaveAttribute('aria-current', 'true')
  })

  it('N alterna notas y Ctrl/Cmd+Z deshace', async () => {
    const { user, cells } = setup()
    const notes = screen.getByRole('button', { name: 'Notas' })
    await user.click(cells()[FIRST_EMPTY]!)
    await user.keyboard('n')
    expect(notes).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('2')
    expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/notas 2$/)
    await user.keyboard('{Control>}z{/Control}')
    expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/vacía$/)
    await user.keyboard('n4{Meta>}z{/Meta}')
    expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/vacía$/)
  })

  it('se ignora con un diálogo abierto', async () => {
    const { user, cells } = setup()
    await user.click(cells()[FIRST_EMPTY]!)
    await user.click(screen.getByRole('button', { name: 'Nueva partida' }))
    await user.keyboard('7')
    expect(cells()[FIRST_EMPTY]).toHaveAccessibleName(/vacía$/)
  })
})
