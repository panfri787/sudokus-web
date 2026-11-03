import { es } from '../../i18n/es'
import { Dialog } from './Dialog'

interface Props {
  onRetry: () => void
  onNewGame: () => void
}

/** Partida perdida al llegar a 3 fallos (002, FR-005). */
export function LostDialog({ onRetry, onNewGame }: Props) {
  return (
    <Dialog title={es.lost}>
      <p>{es.lostText}</p>
      <div className="dialog-actions">
        <button type="button" className="btn primary" onClick={onRetry}>
          {es.retry}
        </button>
        <button type="button" className="btn" onClick={onNewGame}>
          {es.newGame}
        </button>
      </div>
    </Dialog>
  )
}
