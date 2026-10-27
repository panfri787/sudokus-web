import { useCallback } from 'react'
import type { CellIndex } from '../domain'
import { es } from '../i18n/es'
import { useGame } from '../state/gameContext'
import { Cell } from './Cell'

const ROWS = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c))

export function Board() {
  const { game, derived, dispatch } = useGame()
  const onSelect = useCallback((cell: CellIndex) => dispatch({ type: 'select', cell }), [dispatch])
  if (!game || !derived) return null
  const highlight = derived.highlight

  return (
    <div className="board" role="grid" aria-label={es.board}>
      {ROWS.map((cells, r) => (
        <div className="board-row" role="row" key={r}>
          {cells.map((i) => (
            <div className="board-cell" role="gridcell" key={i}>
              <Cell
                index={i}
                value={game.values[i]!}
                given={game.puzzle.givens[i] !== 0}
                notes={game.notes[i]!}
                selected={game.selected === i}
                conflict={derived.conflicts.has(i)}
                related={highlight.related.has(i)}
                same={highlight.sameDigit.has(i)}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
