import { es } from '../i18n/es'
import { useGame } from '../state/gameContext'

interface Props {
  onNewGame: () => void
}

export function Toolbar({ onNewGame }: Props) {
  const { game, dispatch } = useGame()
  const canUndo = !!game && game.history.length > 0 && game.status === 'playing'
  return (
    <div className="toolbar">
      <button type="button" className="btn" onClick={() => dispatch({ type: 'erase' })}>
        {es.erase}
      </button>
      <button
        type="button"
        className="btn"
        aria-pressed={game?.notesMode ?? false}
        onClick={() => dispatch({ type: 'toggleNotesMode' })}
      >
        {es.notes}
      </button>
      <button
        type="button"
        className="btn"
        disabled={!canUndo}
        onClick={() => dispatch({ type: 'undo' })}
      >
        {es.undo}
      </button>
      <button type="button" className="btn" onClick={onNewGame}>
        {es.newGame}
      </button>
    </div>
  )
}
