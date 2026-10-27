import { describe, expect, it } from 'vitest'
import { boxOf, colOf, findConflicts, peers, rowOf, type CellValue } from '../../src/domain'
import { parseGrid, SOLUTION } from './fixtures'

describe('peers', () => {
  it.each([0, 40, 80])('celda %i: 20 pares únicos que comparten fila, columna o caja', (i) => {
    const p = peers(i)
    expect(p).toHaveLength(20)
    expect(new Set(p).size).toBe(20)
    expect(p).not.toContain(i)
    for (const j of p) {
      expect(rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i)).toBe(true)
    }
  })
})

describe('findConflicts', () => {
  const empty = (): CellValue[] => Array(81).fill(0)

  it('detecta repeticiones en fila', () => {
    const g = empty()
    g[0] = 5
    g[8] = 5
    expect([...findConflicts(g)].sort((a, b) => a - b)).toEqual([0, 8])
  })

  it('detecta repeticiones en columna', () => {
    const g = empty()
    g[4] = 3
    g[76] = 3
    expect([...findConflicts(g)].sort((a, b) => a - b)).toEqual([4, 76])
  })

  it('detecta repeticiones en caja', () => {
    const g = empty()
    g[0] = 9
    g[20] = 9
    expect([...findConflicts(g)].sort((a, b) => a - b)).toEqual([0, 20])
  })

  it('ignora las celdas vacías', () => {
    expect(findConflicts(empty()).size).toBe(0)
  })

  it('devuelve vacío para una solución válida', () => {
    expect(findConflicts(parseGrid(SOLUTION)).size).toBe(0)
  })
})
