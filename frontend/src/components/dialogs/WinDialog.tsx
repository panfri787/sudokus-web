import { es, formatTime } from '../../i18n/es'
import { Dialog } from './Dialog'

interface Props {
  elapsedMs: number
  onNewGame: () => void
}

export function WinDialog({ elapsedMs, onNewGame }: Props) {
  return (
    <Dialog title={es.won}>
      <p>{es.wonTime(formatTime(elapsedMs))}</p>
      <div className="dialog-actions">
        <button type="button" className="btn primary" onClick={onNewGame}>
          {es.newGame}
        </button>
      </div>
    </Dialog>
  )
}
