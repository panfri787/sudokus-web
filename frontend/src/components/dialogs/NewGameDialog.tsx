import type { Difficulty } from '../../domain'
import { es } from '../../i18n/es'
import { Dialog } from './Dialog'

const LEVELS: readonly Difficulty[] = ['easy', 'medium', 'hard']

interface Props {
  onChoose: (difficulty: Difficulty) => void
  onCancel: () => void
}

export function NewGameDialog({ onChoose, onCancel }: Props) {
  return (
    <Dialog title={es.newGame} onClose={onCancel}>
      <p>{es.chooseLevel}</p>
      <div className="dialog-actions">
        {LEVELS.map((level) => (
          <button key={level} type="button" className="btn primary" onClick={() => onChoose(level)}>
            {es.difficulty[level]}
          </button>
        ))}
        <button type="button" className="btn" onClick={onCancel}>
          {es.cancel}
        </button>
      </div>
    </Dialog>
  )
}
