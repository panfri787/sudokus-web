import type { Difficulty, Digit } from '../domain'

export const es = {
  appTitle: 'Sudoku',
  difficulty: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' } satisfies Record<Difficulty, string>,
  board: 'Tablero de sudoku',
  numbers: 'Números',
  timer: 'Tiempo',
  erase: 'Borrar',
  notes: 'Notas',
  undo: 'Deshacer',
  newGame: 'Nueva partida',
  cancel: 'Cancelar',
  startNew: 'Empezar nueva',
  keepPlaying: 'Seguir jugando',
  confirmDiscard: '¿Empezar una partida nueva? Se perderá la actual.',
  won: '¡Resuelto!',
  wonTime: (time: string) => `Tiempo: ${time}`,
  generating: 'Generando…',
  chooseLevel: 'Elige el nivel',
  digitDone: (d: Digit) => `${d}, completo`,
  cell(row: number, col: number, state: CellLabelState): string {
    const base = `Fila ${row}, columna ${col}`
    let what: string
    if (state.given) what = `pista ${state.value}`
    else if (state.value) what = `valor ${state.value}`
    else if (state.notes.length) what = `notas ${state.notes.join(', ')}`
    else what = 'vacía'
    return `${base}, ${what}${state.conflict ? ', en conflicto' : ''}`
  },
}

export interface CellLabelState {
  given: boolean
  value: number
  notes: readonly number[]
  conflict: boolean
}

/** `mm:ss` (o `h:mm:ss` a partir de una hora). */
export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
