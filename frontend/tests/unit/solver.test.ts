import { describe, expect, it } from 'vitest'
import { countSolutions, solve, type CellValue } from '../../src/domain'
import { parseGrid, PUZZLE, SOLUTION } from './fixtures'

describe('countSolutions', () => {
  it('devuelve 1 para un puzle de solución única', () => {
    expect(countSolutions(parseGrid(PUZZLE), 2)).toBe(1)
  })

  it('devuelve 2 (el límite) para un tablero casi vacío', () => {
    const g: CellValue[] = Array(81).fill(0)
    g[0] = 1
    expect(countSolutions(g, 2)).toBe(2)
  })

  it('nunca supera el límite', () => {
    expect(countSolutions(Array(81).fill(0), 1)).toBe(1)
    expect(countSolutions(Array(81).fill(0), 3)).toBe(3)
  })

  it('devuelve 0 para un tablero con conflicto', () => {
    const g = [...parseGrid(PUZZLE)]
    g[2] = 5 // 5 repetido en la fila 0
    expect(countSolutions(g, 2)).toBe(0)
  })
})

describe('solve', () => {
  it('resuelve el puzle conocido', () => {
    expect(solve(parseGrid(PUZZLE))).toEqual(parseGrid(SOLUTION))
  })

  it('devuelve null para un tablero imposible', () => {
    // Fila 0 con 1-8 y la columna 8 ya contiene un 9: la celda 8 no tiene candidatos.
    const g: CellValue[] = Array(81).fill(0)
    for (let c = 0; c < 8; c++) g[c] = (c + 1) as CellValue
    g[17] = 9
    expect(solve(g)).toBeNull()
  })

  it('no muta la entrada', () => {
    const g = parseGrid(PUZZLE)
    const copy = [...g]
    solve(g)
    countSolutions(g, 2)
    expect(g).toEqual(copy)
  })
})
