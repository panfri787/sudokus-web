import { es } from '../../i18n/es'
import { Dialog } from './Dialog'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ onConfirm, onCancel }: Props) {
  return (
    <Dialog title={es.newGame} onClose={onCancel}>
      <p>{es.confirmDiscard}</p>
      <div className="dialog-actions">
        <button type="button" className="btn primary" onClick={onConfirm}>
          {es.startNew}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          {es.keepPlaying}
        </button>
      </div>
    </Dialog>
  )
}
