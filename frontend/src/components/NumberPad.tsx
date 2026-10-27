import { DIGITS } from '../domain'
import { es } from '../i18n/es'
import { useGame } from '../state/gameContext'

export function NumberPad() {
  const { derived, dispatch } = useGame()
  return (
    <div className="numpad" role="group" aria-label={es.numbers}>
      {DIGITS.map((d) => {
        const done = (derived?.digitCounts[d] ?? 0) >= 9
        return (
          <button
            key={d}
            type="button"
            className="key"
            aria-label={done ? es.digitDone(d) : String(d)}
            aria-disabled={done || undefined}
            onClick={() => dispatch({ type: 'input', digit: d })}
          >
            {d}
            {done && (
              <span className="key-done" aria-hidden="true">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
