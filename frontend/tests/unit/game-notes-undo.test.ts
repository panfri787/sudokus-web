import { describe, expect, it } from 'vitest'
import {
  boxOf,
  colOf,
  derive,
  gameReducer,
  newGame,
  peers,
  rowOf,
  type Digit,
  type Game,
  type GameAction,
} from '../../src/domain'
import { FIRST_EMPTY, SUDOKU } from './fixtures'

const start = () => newGame(SUDOKU, 0)
const run = (g: Game, ...actions: GameAction[]) => actions.reduce(gameReducer, g)
const bit = (d: number) => 1 << (d - 1)
const empties = SUDOKU.givens.flatMap((v, i) => (v === 0 ? [i] : []))
/** Celda vacía de la misma fila que FIRST_EMPTY. */
const SAME_ROW = empties.find((i) => i !== FIRST_EMPTY && rowOf(i) === rowOf(FIRST_EMPTY))!

const invariantHolds = (g: Game) =>
  g.notes.every((n, i) => n === 0 || (g.values[i] === 0 && SUDOKU.givens[i] === 0))

describe('modo notas', () => {
  it('toggleNotesMode invierte el modo', () => {
    const g = run(start(), { type: 'toggleNotesMode' })
    expect(g.notesMode).toBe(true)
    expect(run(g, { type: 'toggleNotesMode' }).notesMode).toBe(false)
  })

  it('alterna el bit de la nota y registra la jugada', () => {
    let g = run(start(), { type: 'toggleNotesMode' }, { type: 'select', cell: FIRST_EMPTY })
    g = run(g, { type: 'input', digit: 1 }, { type: 'input', digit: 3 })
    expect(g.notes[FIRST_EMPTY]).toBe(bit(1) | bit(3))
    expect(g.history.map((m) => m.kind)).toEqual(['toggleNote', 'toggleNote'])
    g = run(g, { type: 'input', digit: 1 })
    expect(g.notes[FIRST_EMPTY]).toBe(bit(3))
  })

  it('no anota en celdas con valor', () => {
    let g = run(start(), { type: 'select', cell: FIRST_EMPTY }, { type: 'input', digit: 4 })
    g = run(g, { type: 'toggleNotesMode' })
    expect(run(g, { type: 'input', digit: 2 })).toBe(g)
  })

  it('poner un número limpia sus notas y quita ese dígito de los pares', () => {
    let g = run(start(), { type: 'toggleNotesMode' })
    for (const i of [FIRST_EMPTY, SAME_ROW])
      g = run(g, { type: 'select', cell: i }, { type: 'input', digit: 1 }, { type: 'input', digit: 3 })
    g = run(g, { type: 'toggleNotesMode' }, { type: 'select', cell: SAME_ROW }, { type: 'input', digit: 3 })
    expect(g.notes[SAME_ROW]).toBe(0)
    expect(g.notes[FIRST_EMPTY]).toBe(bit(1))
    const move = g.history.at(-1)!
    expect(move.before).toContainEqual({ cell: SAME_ROW, value: 0, notes: bit(1) | bit(3) })
    expect(move.before).toContainEqual({ cell: FIRST_EMPTY, value: 0, notes: bit(1) | bit(3) })
    expect(move.before.every((s) => s.cell === SAME_ROW || peers(SAME_ROW).includes(s.cell))).toBe(
      true,
    )
    expect(invariantHolds(g)).toBe(true)
  })

  it('erase vacía valor y notas', () => {
    let g = run(start(), { type: 'toggleNotesMode' }, { type: 'select', cell: FIRST_EMPTY })
    g = run(g, { type: 'input', digit: 2 }, { type: 'erase' })
    expect(g.notes[FIRST_EMPTY]).toBe(0)
    expect(g.history.at(-1)!.kind).toBe('erase')
  })
})

describe('deshacer', () => {
  it('restaura exactamente el estado previo de cada jugada', () => {
    const s0 = run(start(), { type: 'toggleNotesMode' }, { type: 'select', cell: FIRST_EMPTY })
    const s1 = run(s0, { type: 'input', digit: 1 }, { type: 'input', digit: 3 })
    const s2 = run(s1, { type: 'toggleNotesMode' }, { type: 'select', cell: SAME_ROW }, { type: 'input', digit: 3 })
    const u1 = run(s2, { type: 'undo' })
    expect(u1.values).toEqual(s1.values)
    expect(u1.notes).toEqual(s1.notes)
    expect(u1.history).toEqual(s1.history)
    const u3 = run(u1, { type: 'undo' }, { type: 'undo' })
    expect(u3.values).toEqual(s0.values)
    expect(u3.notes).toEqual(s0.notes)
    expect(u3.history).toEqual([])
  })

  it('sin historial no hace nada', () => {
    const g = start()
    expect(run(g, { type: 'undo' })).toBe(g)
  })

  it('tras ganar no deshace', () => {
    let g = start()
    for (const i of empties)
      g = run(g, { type: 'select', cell: i }, { type: 'input', digit: SUDOKU.solution[i] as Digit })
    expect(g.status).toBe('won')
    expect(run(g, { type: 'undo' })).toBe(g)
  })
})

describe('resaltado', () => {
  it('related cubre fila, columna y caja; sameDigit el mismo valor', () => {
    const g = run(start(), { type: 'select', cell: 0 }) // pista 5
    const { related, sameDigit } = derive(g).highlight
    for (let i = 0; i < 81; i++) {
      const shares = rowOf(i) === 0 || colOf(i) === 0 || boxOf(i) === 0
      expect(related.has(i)).toBe(shares && i !== 0)
    }
    const fives = SUDOKU.givens.flatMap((v, i) => (v === 5 ? [i] : []))
    expect([...sameDigit].sort((a, b) => a - b)).toEqual(fives)
  })

  it('sin selección no resalta nada', () => {
    const { related, sameDigit } = derive(start()).highlight
    expect(related.size + sameDigit.size).toBe(0)
  })
})
