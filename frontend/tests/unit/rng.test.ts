import { describe, expect, it } from 'vitest'
import { createRng, randomSeed } from '../../src/domain'

const take = (seed: number, n: number) => {
  const rng = createRng(seed)
  return Array.from({ length: n }, () => rng())
}

describe('createRng', () => {
  it('es determinista para la misma semilla', () => {
    expect(take(42, 100)).toEqual(take(42, 100))
  })

  it('devuelve valores en [0, 1)', () => {
    for (const v of take(7, 1000)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('genera secuencias distintas para semillas distintas', () => {
    expect(take(1, 10)).not.toEqual(take(2, 10))
  })
})

describe('randomSeed', () => {
  it('devuelve un entero de 32 bits sin signo', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomSeed()
      expect(Number.isInteger(s)).toBe(true)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(0xffffffff)
    }
  })
})
