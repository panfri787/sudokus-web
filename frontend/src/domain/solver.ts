import { findConflicts } from './rules'
import { boxOf, CELLS, colOf, rowOf, type CellValue, type Grid } from './types'

const ALL = 0x1ff
const ROW = Array.from({ length: CELLS }, (_, i) => rowOf(i))
const COL = Array.from({ length: CELLS }, (_, i) => colOf(i))
const BOX = Array.from({ length: CELLS }, (_, i) => boxOf(i))

function popcount(n: number): number {
  let c = 0
  while (n) {
    n &= n - 1
    c++
  }
  return c
}

/**
 * Backtracking con máscaras de bits y MRV. Llama a `onSolution` por cada solución encontrada
 * y se detiene cuando devuelve `true`.
 */
function search(grid: Grid, onSolution: (cells: Uint8Array) => boolean): void {
  if (grid.length !== CELLS || findConflicts(grid).size > 0) return
  const cells = Uint8Array.from(grid)
  const rows = new Uint16Array(9)
  const cols = new Uint16Array(9)
  const boxes = new Uint16Array(9)
  for (let i = 0; i < CELLS; i++) {
    const v = cells[i]!
    if (v) {
      const bit = 1 << (v - 1)
      rows[ROW[i]!]! |= bit
      cols[COL[i]!]! |= bit
      boxes[BOX[i]!]! |= bit
    }
  }

  const step = (): boolean => {
    let best = -1
    let bestMask = 0
    let bestCount = 10
    for (let i = 0; i < CELLS; i++) {
      if (cells[i]) continue
      const mask = ALL & ~(rows[ROW[i]!]! | cols[COL[i]!]! | boxes[BOX[i]!]!)
      const count = popcount(mask)
      if (count === 0) return false
      if (count < bestCount) {
        best = i
        bestMask = mask
        bestCount = count
        if (count === 1) break
      }
    }
    if (best === -1) return onSolution(cells)

    const r = ROW[best]!
    const c = COL[best]!
    const b = BOX[best]!
    for (let mask = bestMask; mask; mask &= mask - 1) {
      const bit = mask & -mask
      cells[best] = 32 - Math.clz32(bit)
      rows[r]! |= bit
      cols[c]! |= bit
      boxes[b]! |= bit
      const stop = step()
      rows[r]! &= ~bit
      cols[c]! &= ~bit
      boxes[b]! &= ~bit
      cells[best] = 0
      if (stop) return true
    }
    return false
  }

  step()
}

/** Cuenta soluciones hasta `limit` (no explora más allá). */
export function countSolutions(grid: Grid, limit: number): number {
  let count = 0
  if (limit <= 0) return 0
  search(grid, () => ++count >= limit)
  return count
}

/** Primera solución encontrada, o `null` si no tiene. */
export function solve(grid: Grid): Grid | null {
  let result: CellValue[] | null = null
  search(grid, (cells) => {
    result = Array.from(cells) as CellValue[]
    return true
  })
  return result
}
