import { MAX_MISTAKES } from '../../domain'
import { es, formatTime } from '../../i18n/es'
import { Dialog } from './Dialog'

interface Props {
  elapsedMs: number
  mistakes: number
  onNewGame: () => void
}

export function WinDialog({ elapsedMs, mistakes, onNewGame }: Props) {
  return (
    <Dialog title={es.won}>
      <p>{es.wonTime(formatTime(elapsedMs))}</p>
      <p>{es.mistakes(mistakes, MAX_MISTAKES)}</p>
      <div className="dialog-actions">
        <button type="button" className="btn primary" onClick={onNewGame}>
          {es.newGame}
        </button>
      </div>
    </Dialog>
  )
}
