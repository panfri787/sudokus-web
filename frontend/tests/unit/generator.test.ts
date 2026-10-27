import { describe, expect, it } from 'vitest'
import {
  CLUE_RANGES,
  countSolutions,
  generateSudoku,
  solve,
  type Difficulty,
} from '../../src/domain'

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard']
const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 7919)

describe.each(LEVELS)('generateSudoku(%s)', (difficulty) => {
  it.each(SEEDS)('semilla %i: válido, único y dentro del rango', (seed) => {
    const s = generateSudoku(difficulty, seed)
    expect(s.difficulty).toBe(difficulty)
    expect(s.seed).toBe(seed)
    expect(countSolutions(s.givens, 2)).toBe(1)
    expect(solve(s.givens)).toEqual(s.solution)
    s.givens.forEach((v, i) => {
      if (v !== 0) expect(v).toBe(s.solution[i])
    })
    const clues = s.givens.filter((v) => v !== 0).length
    expect(clues).toBeGreaterThanOrEqual(CLUE_RANGES[difficulty].min)
    expect(clues).toBeLessThanOrEqual(CLUE_RANGES[difficulty].max)
  })

  it('es determinista para la misma semilla', () => {
    expect(generateSudoku(difficulty, 99)).toEqual(generateSudoku(difficulty, 99))
  })
})

describe('CLUE_RANGES', () => {
  it('coincide con la especificación', () => {
    expect(CLUE_RANGES).toEqual({
      easy: { min: 36, max: 45 },
      medium: { min: 30, max: 35 },
      hard: { min: 24, max: 29 },
    })
  })
})
