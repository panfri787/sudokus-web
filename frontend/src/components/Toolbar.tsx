import { es } from '../i18n/es'
import { useGame } from '../state/gameContext'

interface Props {
  onNewGame: () => void
}

export function Toolbar({ onNewGame }: Props) {
  const { dispatch } = useGame()
  return (
    <div className="toolbar">
      <button type="button" className="btn" onClick={() => dispatch({ type: 'erase' })}>
        {es.erase}
      </button>
      <button type="button" className="btn" onClick={onNewGame}>
        {es.newGame}
      </button>
    </div>
  )
}
