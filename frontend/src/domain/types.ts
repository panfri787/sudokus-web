/** Valor de una celda rellena. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
/** Valor de una celda: `0` = vacía. */
export type CellValue = Digit | 0
/** Índice de celda `0..80`, orden por filas. */
export type CellIndex = number
/** 81 valores en orden por filas. */
export type Grid = readonly CellValue[]
/** Bit `d-1` activo = nota `d` presente (`0..511`). */
export type NoteMask = number
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Sudoku {
  readonly givens: Grid
  readonly solution: Grid
  readonly difficulty: Difficulty
  readonly seed: number
}

export interface CellSnapshot {
  readonly cell: CellIndex
  readonly value: CellValue
  readonly notes: NoteMask
}

/** Cambio reversible del jugador; `before` guarda todas las celdas que modificó. */
export interface Move {
  readonly kind: 'set' | 'erase' | 'toggleNote'
  readonly cell: CellIndex
  readonly digit: Digit | null
  readonly before: readonly CellSnapshot[]
}

export type GameStatus = 'playing' | 'won'

export interface Game {
  readonly puzzle: Sudoku
  readonly values: Grid
  readonly notes: readonly NoteMask[]
  readonly selected: CellIndex | null
  readonly notesMode: boolean
  readonly history: readonly Move[]
  readonly status: GameStatus
  readonly elapsedMs: number
  readonly runningSince: number | null
  readonly startedAt: number
}

export type GameAction =
  | { type: 'select'; cell: CellIndex }
  | { type: 'input'; digit: Digit }
  | { type: 'erase' }
  | { type: 'undo' }
  | { type: 'toggleNotesMode' }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }

export const CELLS = 81
export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export const rowOf = (i: CellIndex): number => Math.floor(i / 9)
export const colOf = (i: CellIndex): number => i % 9
export const boxOf = (i: CellIndex): number =>
  Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3)

export const isDigit = (n: unknown): n is Digit =>
  typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 9
