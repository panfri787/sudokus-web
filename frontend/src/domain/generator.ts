import { createRng, shuffle, type Rng } from './rng'
import { countSolutions } from './solver'
import { boxOf, CELLS, colOf, DIGITS, rowOf, type CellValue, type Difficulty, type Sudoku } from './types'

export const CLUE_RANGES: Readonly<Record<Difficulty, { min: number; max: number }>> = {
  easy: { min: 36, max: 45 },
  medium: { min: 30, max: 35 },
  hard: { min: 24, max: 29 },
}

const MAX_ATTEMPTS = 200

function canPlace(cells: CellValue[], i: number, d: CellValue): boolean {
  for (let j = 0; j < CELLS; j++) {
    if (cells[j] === d && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i)))
      return false
  }
  return true
}

/** Solución completa aleatoria por backtracking con candidatos barajados. */
function randomSolution(rng: Rng): CellValue[] {
  const cells: CellValue[] = Array(CELLS).fill(0)
  const fill = (i: number): boolean => {
    if (i === CELLS) return true
    for (const d of shuffle(DIGITS, rng)) {
      if (canPlace(cells, i, d)) {
        cells[i] = d
        if (fill(i + 1)) return true
        cells[i] = 0
      }
    }
    return false
  }
  fill(0)
  return cells
}

/**
 * Genera un sudoku con solución única y un número de pistas dentro del rango del nivel.
 * Reintenta con nuevas soluciones hasta conseguirlo (research R3).
 */
export function generateSudoku(difficulty: Difficulty, seed: number): Sudoku {
  const rng = createRng(seed)
  const { min, max } = CLUE_RANGES[difficulty]

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = randomSolution(rng)
    const givens = [...solution]
    const target = min + Math.floor(rng() * (max - min + 1))
    let clues = CELLS

    for (const i of shuffle(
      Array.from({ length: CELLS }, (_, k) => k),
      rng,
    )) {
      if (clues <= target) break
      const v = givens[i]!
      givens[i] = 0
      if (countSolutions(givens, 2) === 1) clues--
      else givens[i] = v
    }

    if (clues <= max) return { givens, solution, difficulty, seed }
  }
  throw new Error('generation-exhausted')
}
