import { describe, expect, it } from 'vitest'
import { derive, gameReducer, newGame, type Digit, type Game, type GameAction } from '../../src/domain'
import { FIRST_EMPTY, SUDOKU } from './fixtures'

const T0 = 1_000_000
const start = () => newGame(SUDOKU, T0)
const run = (g: Game, ...actions: GameAction[]) => actions.reduce(gameReducer, g)
const solutionAt = (i: number) => SUDOKU.solution[i] as Digit
const wrongAt = (i: number) => ((solutionAt(i) % 9) + 1) as Digit

describe('newGame', () => {
  it('parte de las pistas, sin notas ni historial, en juego', () => {
    const g = start()
    expect(g.values).toEqual(SUDOKU.givens)
    expect(g.notes.every((n) => n === 0)).toBe(true)
    expect(g.history).toEqual([])
    expect(g.status).toBe('playing')
    expect(g.runningSince).toBe(T0)
    expect(g.elapsedMs).toBe(0)
    expect(g.selected).toBeNull()
    expect(g.notesMode).toBe(false)
  })
})

describe('select', () => {
  it('selecciona cualquier celda, también pistas', () => {
    expect(run(start(), { type: 'select', cell: 0 }).selected).toBe(0)
    expect(run(start(), { type: 'select', cell: FIRST_EMPTY }).selected).toBe(FIRST_EMPTY)
  })
})

describe('input', () => {
  it('sin selección no hace nada', () => {
    const g = start()
    expect(run(g, { type: 'input', digit: 1 })).toBe(g)
  })

  it('sobre una pista no hace nada', () => {
    const g = run(start(), { type: 'select', cell: 0 })
    expect(run(g, { type: 'input', digit: 1 })).toBe(g)
  })

  it('pone el valor y registra la jugada con el estado previo', () => {
    const g = run(start(), { type: 'select', cell: FIRST_EMPTY }, { type: 'input', digit: 4 })
    expect(g.values[FIRST_EMPTY]).toBe(4)
    expect(g.history).toHaveLength(1)
    expect(g.history[0]).toMatchObject({ kind: 'set', cell: FIRST_EMPTY, digit: 4 })
    expect(g.history[0]!.before).toContainEqual({ cell: FIRST_EMPTY, value: 0, notes: 0 })
  })

  it('no registra nada si el valor ya era el mismo', () => {
    const g = run(start(), { type: 'select', cell: FIRST_EMPTY }, { type: 'input', digit: 4 })
    expect(run(g, { type: 'input', digit: 4 })).toBe(g)
  })
})

describe('erase', () => {
  it('vacía la celda y registra la jugada', () => {
    const g = run(
      start(),
      { type: 'select', cell: FIRST_EMPTY },
      { type: 'input', digit: 4 },
      { type: 'erase' },
    )
    expect(g.values[FIRST_EMPTY]).toBe(0)
    expect(g.history.at(-1)).toMatchObject({ kind: 'erase', cell: FIRST_EMPTY, digit: null })
  })

  it('no registra nada si la celda ya estaba vacía', () => {
    const g = run(start(), { type: 'select', cell: FIRST_EMPTY })
    expect(run(g, { type: 'erase' })).toBe(g)
  })

  it('no borra pistas', () => {
    const g = run(start(), { type: 'select', cell: 0 })
    expect(run(g, { type: 'erase' })).toBe(g)
  })
})

describe('derive', () => {
  it('marca ambas celdas de una repetición', () => {
    // Celda 2 (fila 0) con un 5: la celda 0 tiene la pista 5.
    const g = run(start(), { type: 'select', cell: 2 }, { type: 'input', digit: 5 })
    const { conflicts } = derive(g)
    expect(conflicts.has(0)).toBe(true)
    expect(conflicts.has(2)).toBe(true)
  })

  it('cuenta cada dígito', () => {
    const counts = derive(start()).digitCounts
    const expected = (d: number) => SUDOKU.givens.filter((v) => v === d).length
    for (let d = 1 as Digit; d <= 9; d++) expect(counts[d]).toBe(expected(d))
  })

  it('hasProgress solo con jugadas', () => {
    expect(derive(start()).hasProgress).toBe(false)
    const g = run(start(), { type: 'select', cell: FIRST_EMPTY }, { type: 'input', digit: 1 })
    expect(derive(g).hasProgress).toBe(true)
  })
})

describe('victoria', () => {
  const empties = SUDOKU.givens.flatMap((v, i) => (v === 0 ? [i] : []))

  const fill = (g: Game, cells: number[], value: (i: number) => Digit, now = T0 + 5000) =>
    cells.reduce<Game>(
      (acc, i) => run(acc, { type: 'select', cell: i }, { type: 'input', digit: value(i) }, { type: 'tick', now }),
      g,
    )

  it('completar la solución gana y para el cronómetro', () => {
    const g = fill(start(), empties, solutionAt)
    expect(g.status).toBe('won')
    expect(g.runningSince).toBeNull()
    expect(g.elapsedMs).toBe(5000)
    expect(derive(g).isComplete).toBe(true)
  })

  it('tras ganar no se aceptan jugadas', () => {
    const g = fill(start(), empties, solutionAt)
    const last = empties.at(-1)!
    expect(run(g, { type: 'select', cell: last }, { type: 'erase' }).values).toEqual(g.values)
    expect(run(g, { type: 'input', digit: 1 }).values).toEqual(g.values)
  })

  it('tablero lleno con conflictos no gana', () => {
    const [first, ...rest] = empties
    let g = fill(start(), rest, solutionAt)
    g = fill(g, [first!], wrongAt)
    expect(g.values.every((v) => v !== 0)).toBe(true)
    expect(g.status).toBe('playing')
    expect(derive(g).isComplete).toBe(false)
  })
})

describe('cronómetro', () => {
  it('acumula con tick, pause y resume', () => {
    let g = run(start(), { type: 'tick', now: T0 + 1000 })
    expect(g.elapsedMs).toBe(1000)
    g = run(g, { type: 'pause', now: T0 + 3000 })
    expect(g.elapsedMs).toBe(3000)
    expect(g.runningSince).toBeNull()
    g = run(g, { type: 'tick', now: T0 + 10_000 })
    expect(g.elapsedMs).toBe(3000)
    g = run(g, { type: 'resume', now: T0 + 20_000 }, { type: 'tick', now: T0 + 21_500 })
    expect(g.elapsedMs).toBe(4500)
  })
})

describe('pureza', () => {
  it('no muta el estado de entrada', () => {
    const g = start()
    const snapshot = structuredClone(g)
    run(g, { type: 'select', cell: FIRST_EMPTY }, { type: 'input', digit: 3 }, { type: 'erase' })
    expect(g).toEqual(snapshot)
  })
})
