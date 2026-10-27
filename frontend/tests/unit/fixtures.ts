import type { Grid, Sudoku } from '../../src/domain'

/** Puzle clásico (Wikipedia) con solución única. */
export const PUZZLE =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
export const SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

export function parseGrid(s: string): Grid {
  return [...s].map((c) => Number(c)) as unknown as Grid
}

export const SUDOKU: Sudoku = {
  givens: parseGrid(PUZZLE),
  solution: parseGrid(SOLUTION),
  difficulty: 'medium',
  seed: 1,
}

/** Primera celda vacía del puzle de prueba. */
export const FIRST_EMPTY = PUZZLE.indexOf('0')
