import { es, formatTime } from '../i18n/es'
import { useGame } from '../state/gameContext'

export function StatusBar({ className = '' }: { className?: string }) {
  const { game } = useGame()
  return (
    <div className={`status ${className}`}>
      <span className="status-level">{game ? es.difficulty[game.puzzle.difficulty] : ''}</span>
      <span className="status-timer" role="timer" aria-label={es.timer}>
        {formatTime(game?.elapsedMs ?? 0)}
      </span>
    </div>
  )
}
