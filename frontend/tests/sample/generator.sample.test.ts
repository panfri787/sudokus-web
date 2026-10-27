import { describe, expect, it } from 'vitest'
import { CLUE_RANGES, countSolutions, generateSudoku, type Difficulty } from '../../src/domain'

const N = 1000
const LEVELS: Difficulty[] = ['easy', 'medium', 'hard']
/** Factor para aproximar un móvil de gama media a partir del tiempo en Node (SC-003). */
const MOBILE_SLOWDOWN = 4

const p95 = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.95)]!

describe('muestra de generación (SC-002, SC-003)', () => {
  const stats: Record<string, unknown>[] = []

  it.each(LEVELS)(
    '%s: 1.000 puzles únicos y dentro del rango, p95 x4 < 1 s',
    (difficulty) => {
      const times: number[] = []
      let unique = 0
      let inRange = 0
      for (let seed = 1; seed <= N; seed++) {
        const t0 = performance.now()
        const s = generateSudoku(difficulty, seed)
        times.push(performance.now() - t0)
        if (countSolutions(s.givens, 2) === 1) unique++
        const clues = s.givens.filter((v) => v !== 0).length
        if (clues >= CLUE_RANGES[difficulty].min && clues <= CLUE_RANGES[difficulty].max) inRange++
      }
      const mean = times.reduce((a, b) => a + b, 0) / N
      stats.push({
        nivel: difficulty,
        únicos: unique,
        enRango: inRange,
        mediaMs: mean.toFixed(1),
        p95Ms: p95(times).toFixed(1),
        maxMs: Math.max(...times).toFixed(1),
      })
      console.table(stats)
      expect(unique).toBe(N)
      expect(inRange).toBe(N)
      expect(p95(times) * MOBILE_SLOWDOWN).toBeLessThan(1000)
    },
    600_000,
  )
})
