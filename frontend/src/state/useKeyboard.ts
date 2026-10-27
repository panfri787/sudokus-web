import { useEffect } from 'react'
import { isDigit, type Game, type GameAction } from '../domain'

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/** Teclado físico (contracts/ui-contract.md › Teclado físico). */
export function useKeyboard(
  game: Game | null,
  dispatch: (action: GameAction) => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !game) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) return
      const mod = e.ctrlKey || e.metaKey
      if (mod) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault()
          dispatch({ type: 'undo' })
        }
        return
      }
      const n = Number(e.key)
      if (isDigit(n)) dispatch({ type: 'input', digit: n })
      else if (e.key === '0' || e.key === 'Delete' || e.key === 'Backspace')
        dispatch({ type: 'erase' })
      else if (e.key.toLowerCase() === 'n') dispatch({ type: 'toggleNotesMode' })
      else if (e.key in MOVES) {
        const [dr, dc] = MOVES[e.key]!
        const cur = game.selected ?? 0
        const r = Math.min(8, Math.max(0, Math.floor(cur / 9) + dr))
        const c = Math.min(8, Math.max(0, (cur % 9) + dc))
        dispatch({ type: 'select', cell: r * 9 + c })
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [game, dispatch, enabled])
}
