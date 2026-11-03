import { describe, expect, it } from 'vitest'
import {
  derive,
  gameReducer,
  newGame,
  rowOf,
  type CellIndex,
  type Digit,
  type Game,
  type GameAction,
} from '../../src/domain'
import { FIRST_EMPTY, SUDOKU } from './fixtures'

const start = () => newGame(SUDOKU, 0)
const run = (g: Game, ...actions: GameAction[]) => actions.reduce(gameReducer, g)
const bit = (d: number) => 1 << (d - 1)
const empties = SUDOKU.givens.flatMap((v, i) => (v === 0 ? [i] : []))
const right = (i: CellIndex) => SUDOKU.solution[i] as Digit
/** Un dígito distinto del de la solución (el `n`-ésimo de ellos). */
const wrong = (i: CellIndex, n = 0) =>
  ([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).filter((d) => d !== right(i))[n]!
const GIVEN = SUDOKU.givens.findIndex((v) => v !== 0)
/** Celda vacía de la misma fila que FIRST_EMPTY. */
const SAME_ROW = empties.find((i) => i !== FIRST_EMPTY && rowOf(i) === rowOf(FIRST_EMPTY))!

const put = (g: Game, cell: CellIndex, digit: Digit) =>
  run(g, { type: 'select', cell }, { type: 'input', digit })

describe('contar fallos (US1)', () => {
  it('una partida nueva empieza con 0 fallos', () => {
    expect(start().mistakes).toBe(0)
  })

  it('un número correcto no cuenta como fallo', () => {
    const g = put(start(), FIRST_EMPTY, right(FIRST_EMPTY))
    expect(g.mistakes).toBe(0)
  })

  it('un número incorrecto suma un fallo, se coloca y se registra', () => {
    const d = wrong(FIRST_EMPTY)
    const g = put(start(), FIRST_EMPTY, d)
    expect(g.mistakes).toBe(1)
    expect(g.values[FIRST_EMPTY]).toBe(d)
    expect(g.history.at(-1)).toMatchObject({ kind: 'set', cell: FIRST_EMPTY, digit: d })
  })

  it('sustituir un número del jugador por otro incorrecto también cuenta', () => {
    let g = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY, 0))
    g = run(g, { type: 'input', digit: wrong(FIRST_EMPTY, 1) })
    expect(g.mistakes).toBe(2)
  })

  it('repetir el número que ya tiene la celda no hace nada', () => {
    const g = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY))
    expect(run(g, { type: 'input', digit: wrong(FIRST_EMPTY) })).toBe(g)
  })

  it('borrar o deshacer y volver a poner el mismo número incorrecto cuenta otra vez', () => {
    const d = wrong(FIRST_EMPTY)
    for (const back of [{ type: 'erase' }, { type: 'undo' }] as GameAction[]) {
      let g = put(start(), FIRST_EMPTY, d)
      g = run(g, back, { type: 'input', digit: d })
      expect(g.mistakes).toBe(2)
    }
  })

  it('borrar, deshacer, notas y modo notas no cambian el contador', () => {
    let g = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY))
    g = run(g, { type: 'erase' })
    expect(g.mistakes).toBe(1)
    g = run(g, { type: 'undo' }, { type: 'undo' })
    expect(g.mistakes).toBe(1)
    g = run(
      g,
      { type: 'toggleNotesMode' },
      { type: 'select', cell: SAME_ROW },
      { type: 'input', digit: wrong(SAME_ROW) },
      { type: 'input', digit: wrong(SAME_ROW) },
      { type: 'toggleNotesMode' },
    )
    expect(g.mistakes).toBe(1)
  })

  it('con una pista seleccionada no ocurre nada', () => {
    const g = run(start(), { type: 'select', cell: GIVEN })
    expect(run(g, { type: 'input', digit: wrong(GIVEN) })).toBe(g)
  })

  it('un número incorrecto no quita notas de sus pares; uno correcto sí (research R3)', () => {
    const d = right(FIRST_EMPTY)
    let g = run(
      start(),
      { type: 'toggleNotesMode' },
      { type: 'select', cell: SAME_ROW },
      { type: 'input', digit: d },
      { type: 'input', digit: wrong(FIRST_EMPTY) },
      { type: 'toggleNotesMode' },
    )
    const before = g.notes[SAME_ROW]!
    g = put(g, FIRST_EMPTY, wrong(FIRST_EMPTY))
    expect(g.notes[SAME_ROW]).toBe(before)
    g = run(g, { type: 'input', digit: d })
    expect(g.notes[SAME_ROW]).toBe(before & ~bit(d))
  })
})

describe('derive().wrong', () => {
  it('contiene solo las celdas del jugador distintas de la solución', () => {
    let g = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY))
    g = put(g, SAME_ROW, right(SAME_ROW))
    expect([...derive(g).wrong]).toEqual([FIRST_EMPTY])
  })

  it('queda vacío al borrar o deshacer el número incorrecto', () => {
    const g = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY))
    expect(derive(run(g, { type: 'erase' })).wrong.size).toBe(0)
    expect(derive(run(g, { type: 'undo' })).wrong.size).toBe(0)
  })
})

describe('derrota a 3 fallos y reintentar (US2)', () => {
  /** Partida con dos fallos en dos celdas distintas y el cronómetro en marcha desde 0. */
  const twoMistakes = () => {
    let g = put(start(), empties[0]!, wrong(empties[0]!))
    g = put(g, empties[1]!, wrong(empties[1]!))
    expect(g.mistakes).toBe(2)
    return g
  }

  it('el tercer fallo pierde la partida y para el cronómetro', () => {
    let g = run(twoMistakes(), { type: 'tick', now: 5000 })
    g = put(g, empties[2]!, wrong(empties[2]!))
    expect(g.mistakes).toBe(3)
    expect(g.status).toBe('lost')
    expect(g.runningSince).toBeNull()
    expect(g.elapsedMs).toBe(5000)
  })

  it('con la partida perdida, poner, borrar, deshacer y reanudar no hacen nada', () => {
    let g = put(twoMistakes(), empties[2]!, wrong(empties[2]!))
    g = run(g, { type: 'select', cell: empties[3]! })
    for (const a of [
      { type: 'input', digit: right(empties[3]!) },
      { type: 'erase' },
      { type: 'undo' },
      { type: 'resume', now: 9000 },
    ] as GameAction[])
      expect(run(g, a)).toBe(g)
  })

  it('retry reinicia el mismo sudoku desde cero', () => {
    const lost = put(twoMistakes(), empties[2]!, wrong(empties[2]!))
    const g = run(lost, { type: 'retry', now: 7000 })
    expect(g.puzzle).toBe(lost.puzzle)
    expect(g.values).toEqual(SUDOKU.givens)
    expect(g.notes.every((n) => n === 0)).toBe(true)
    expect(g).toMatchObject({
      mistakes: 0,
      history: [],
      status: 'playing',
      elapsedMs: 0,
      runningSince: 7000,
      notesMode: false,
      selected: null,
    })
  })

  it('retry solo actúa con la partida perdida', () => {
    const playing = put(start(), FIRST_EMPTY, wrong(FIRST_EMPTY))
    expect(run(playing, { type: 'retry', now: 1 })).toBe(playing)
    const won = { ...start(), status: 'won' as const, runningSince: null }
    expect(run(won, { type: 'retry', now: 1 })).toBe(won)
  })

  it('se puede volver a perder tras reintentar', () => {
    let g = run(put(twoMistakes(), empties[2]!, wrong(empties[2]!)), { type: 'retry', now: 0 })
    for (const i of empties.slice(0, 3)) g = put(g, i, wrong(i))
    expect(g.status).toBe('lost')
  })
})
