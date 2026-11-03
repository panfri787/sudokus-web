import { describe, expect, it } from 'vitest'
import {
  fromStored,
  gameReducer,
  newGame,
  toStored,
  type Game,
  type GameAction,
} from '../../src/domain'
import { FIRST_EMPTY, SUDOKU } from './fixtures'

const T0 = 5_000_000
const run = (g: Game, ...actions: GameAction[]) => actions.reduce(gameReducer, g)

function played(): Game {
  return run(
    newGame(SUDOKU, T0),
    { type: 'select', cell: FIRST_EMPTY },
    { type: 'input', digit: 4 },
    { type: 'toggleNotesMode' },
    { type: 'select', cell: FIRST_EMPTY + 1 },
    { type: 'input', digit: 2 },
    { type: 'input', digit: 6 },
  )
}

type Stored = ReturnType<typeof toStored>
const valid = () => toStored(played(), T0 + 4000) as Stored & Record<string, unknown>
const mutate = (f: (s: Record<string, unknown>) => void) => {
  const s = structuredClone(valid()) as Record<string, unknown>
  f(s)
  return s
}

describe('toStored', () => {
  it('produce el formato StoredGame', () => {
    const s = valid()
    expect(s.schema).toBe(1)
    expect(s.puzzle.givens).toMatch(/^[0-9]{81}$/)
    expect(s.puzzle.solution).toMatch(/^[1-9]{81}$/)
    expect(s.values).toMatch(/^[0-9]{81}$/)
    expect(s.notes).toHaveLength(81)
    expect(s).not.toHaveProperty('selected')
    expect(s).not.toHaveProperty('runningSince')
    expect(s.elapsedMs).toBe(4000)
  })
})

describe('fromStored', () => {
  it('reconstruye la partida', () => {
    const g = played()
    const back = fromStored(toStored(g, T0 + 4000))!
    expect(back.values).toEqual(g.values)
    expect(back.notes).toEqual(g.notes)
    expect(back.history).toEqual(g.history)
    expect(back.notesMode).toBe(true)
    expect(back.puzzle).toEqual(g.puzzle)
    expect(back.elapsedMs).toBe(4000)
    expect(back.selected).toBeNull()
    expect(back.runningSince).toBeNull()
  })

  it.each<[string, unknown]>([
    ['null', null],
    ['no objeto', 'hola'],
    ['schema distinto', mutate((s) => (s.schema = 2))],
    ['falta un campo', mutate((s) => delete s.values)],
    ['longitud ≠ 81', mutate((s) => (s.values = (s.values as string).slice(1)))],
    ['carácter fuera de rango', mutate((s) => (s.values = 'x' + (s.values as string).slice(1)))],
    ['nota fuera de rango', mutate((s) => ((s.notes as number[])[FIRST_EMPTY + 1] = 512))],
    [
      'values distinto de givens en una pista',
      mutate((s) => (s.values = '9' + (s.values as string).slice(1))),
    ],
    [
      'solution distinta de givens',
      mutate((s) => {
        const p = s.puzzle as { solution: string }
        p.solution = p.solution.charAt(1) + p.solution.charAt(0) + p.solution.slice(2)
      }),
    ],
    [
      'solution inválida',
      mutate((s) => {
        const p = s.puzzle as Record<string, string>
        p.solution = '1'.repeat(81)
      }),
    ],
    ['nota en celda con valor', mutate((s) => ((s.notes as number[])[FIRST_EMPTY] = 1))],
    ['nota en celda con pista', mutate((s) => ((s.notes as number[])[0] = 1))],
    ['nivel inválido', mutate((s) => ((s.puzzle as Record<string, unknown>).difficulty = 'x'))],
    ['estado inválido', mutate((s) => (s.status = 'lost'))],
    ['historial no lista', mutate((s) => (s.history = {}))],
  ])('devuelve null si %s', (_, data) => {
    expect(fromStored(data)).toBeNull()
  })
})

describe('fallos y derrota (002)', () => {
  const empties = SUDOKU.givens.flatMap((v, i) => (v === 0 ? [i] : []))
  const wrongAt = (i: number) => (SUDOKU.solution[i] === 1 ? 2 : 1) as 1 | 2
  const withMistakes = (n: number) =>
    empties
      .slice(0, n)
      .reduce<Game>(
        (g, i) => run(g, { type: 'select', cell: i }, { type: 'input', digit: wrongAt(i) }),
        newGame(SUDOKU, T0),
      )

  it('toStored incluye mistakes', () => {
    expect(toStored(withMistakes(2), T0).mistakes).toBe(2)
  })

  it('ida y vuelta conserva los fallos y la derrota', () => {
    const one = fromStored(toStored(withMistakes(1), T0))!
    expect(one).toMatchObject({ mistakes: 1, status: 'playing' })
    const lost = fromStored(toStored(withMistakes(3), T0))!
    expect(lost).toMatchObject({ mistakes: 3, status: 'lost', runningSince: null })
  })

  it('una partida guardada sin mistakes se restaura con 0 (FR-008)', () => {
    const s = mutate((x) => delete x.mistakes)
    expect(fromStored(s)?.mistakes).toBe(0)
  })

  it.each([-1, 4, 1.5, '2', null])('rechaza mistakes = %j', (m) => {
    expect(fromStored(mutate((x) => (x.mistakes = m)))).toBeNull()
  })

  it('rechaza estados incoherentes con el contador', () => {
    expect(fromStored(mutate((x) => ((x.status = 'lost'), (x.mistakes = 2))))).toBeNull()
    expect(fromStored(mutate((x) => ((x.status = 'playing'), (x.mistakes = 3))))).toBeNull()
    expect(fromStored(mutate((x) => (x.status = 'paused')))).toBeNull()
  })
})
