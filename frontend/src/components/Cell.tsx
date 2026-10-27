import { memo } from 'react'
import { DIGITS, type CellIndex, type CellValue, type NoteMask } from '../domain'
import { es } from '../i18n/es'

interface Props {
  index: CellIndex
  value: CellValue
  given: boolean
  notes: NoteMask
  selected: boolean
  conflict: boolean
  related: boolean
  same: boolean
  onSelect: (index: CellIndex) => void
}

export const Cell = memo(function Cell(p: Props) {
  const row = Math.floor(p.index / 9)
  const col = p.index % 9
  const noteDigits = DIGITS.filter((d) => p.notes & (1 << (d - 1)))
  const classes = [
    'cell',
    p.given ? 'given' : p.value ? 'player' : '',
    p.selected && 'selected',
    !p.selected && p.same && 'same',
    !p.selected && !p.same && p.related && 'related',
    p.conflict && 'conflict',
    col % 3 === 2 && col < 8 && 'box-right',
    row % 3 === 2 && row < 8 && 'box-bottom',
    col === 8 && 'last-col',
    row === 8 && 'last-row',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      aria-label={es.cell(row + 1, col + 1, {
        given: p.given,
        value: p.value,
        notes: noteDigits,
        conflict: p.conflict,
      })}
      aria-current={p.selected || undefined}
      tabIndex={p.selected ? 0 : -1}
      onPointerDown={() => p.onSelect(p.index)}
      onClick={() => p.onSelect(p.index)}
    >
      {p.value ? (
        <span className="cell-value" aria-hidden="true">
          {p.value}
        </span>
      ) : noteDigits.length ? (
        <span className="notes" aria-hidden="true">
          {DIGITS.map((d) => (
            <span key={d}>{noteDigits.includes(d) ? d : ''}</span>
          ))}
        </span>
      ) : null}
    </button>
  )
})
