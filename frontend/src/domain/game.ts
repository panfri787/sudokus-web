import { findConflicts, peers } from './rules'
import {
  CELLS,
  DIGITS,
  type CellIndex,
  type CellSnapshot,
  type CellValue,
  type Digit,
  type Game,
  type GameAction,
  type Move,
  type Sudoku,
} from './types'

export function newGame(puzzle: Sudoku, now: number): Game {
  return {
    puzzle,
    values: [...puzzle.givens],
    notes: Array<number>(CELLS).fill(0),
    selected: null,
    notesMode: false,
    history: [],
    status: 'playing',
    elapsedMs: 0,
    runningSince: now,
    startedAt: now,
  }
}

const isGiven = (g: Game, i: CellIndex) => g.puzzle.givens[i] !== 0

const snapshot = (g: Game, cell: CellIndex): CellSnapshot => ({
  cell,
  value: g.values[cell]!,
  notes: g.notes[cell]!,
})

/** Aplica cambios de celdas, registra la jugada y comprueba la victoria. */
function commit(
  g: Game,
  move: Omit<Move, 'before'>,
  changes: readonly { cell: CellIndex; value: CellValue; notes: number }[],
  now: number | null,
): Game {
  const values = [...g.values]
  const notes = [...g.notes]
  const before = changes.map((c) => snapshot(g, c.cell))
  for (const c of changes) {
    values[c.cell] = c.value
    notes[c.cell] = c.notes
  }
  const next: Game = { ...g, values, notes, history: [...g.history, { ...move, before }] }
  return isSolved(values) ? win(next, now) : next
}

function isSolved(values: readonly CellValue[]): boolean {
  return values.every((v) => v !== 0) && findConflicts(values).size === 0
}

function stopClock(g: Game, now: number | null): Game {
  if (g.runningSince == null) return g
  const elapsed = now == null ? 0 : Math.max(0, now - g.runningSince)
  return { ...g, elapsedMs: g.elapsedMs + elapsed, runningSince: null }
}

function win(g: Game, now: number | null): Game {
  return { ...stopClock(g, now), status: 'won' }
}

const bit = (d: Digit) => 1 << (d - 1)

/** Pone un número, limpia sus notas y quita ese dígito de las notas de sus pares (FR-011). */
function setDigit(g: Game, cell: CellIndex, digit: Digit): Game {
  if (g.values[cell] === digit) return g
  const b = bit(digit)
  const changes = [{ cell, value: digit as CellValue, notes: 0 }]
  for (const p of peers(cell)) {
    const n = g.notes[p]!
    if (n & b) changes.push({ cell: p, value: g.values[p]!, notes: n & ~b })
  }
  return commit(g, { kind: 'set', cell, digit }, changes, null)
}

function toggleNote(g: Game, cell: CellIndex, digit: Digit): Game {
  if (g.values[cell] !== 0) return g
  const notes = g.notes[cell]! ^ bit(digit)
  return commit(g, { kind: 'toggleNote', cell, digit }, [{ cell, value: 0, notes }], null)
}

function undo(g: Game): Game {
  const last = g.history.at(-1)
  if (!last || g.status !== 'playing') return g
  const values = [...g.values]
  const notes = [...g.notes]
  for (const s of last.before) {
    values[s.cell] = s.value
    notes[s.cell] = s.notes
  }
  return { ...g, values, notes, history: g.history.slice(0, -1) }
}

function erase(g: Game, cell: CellIndex): Game {
  if (g.values[cell] === 0 && g.notes[cell] === 0) return g
  return commit(g, { kind: 'erase', cell, digit: null }, [{ cell, value: 0, notes: 0 }], null)
}

/** Reducer puro de la partida (contracts/domain-api.md). */
export function gameReducer(g: Game, action: GameAction): Game {
  switch (action.type) {
    case 'select':
      return g.selected === action.cell ? g : { ...g, selected: action.cell }

    case 'input': {
      const i = g.selected
      if (i == null || g.status !== 'playing' || isGiven(g, i)) return g
      return g.notesMode ? toggleNote(g, i, action.digit) : setDigit(g, i, action.digit)
    }

    case 'erase': {
      const i = g.selected
      if (i == null || g.status !== 'playing' || isGiven(g, i)) return g
      return erase(g, i)
    }

    case 'undo':
      return undo(g)

    case 'toggleNotesMode':
      return { ...g, notesMode: !g.notesMode }

    case 'tick':
    case 'pause': {
      if (g.runningSince == null) return g
      const elapsedMs = g.elapsedMs + Math.max(0, action.now - g.runningSince)
      return { ...g, elapsedMs, runningSince: action.type === 'tick' ? action.now : null }
    }

    case 'resume':
      return g.status === 'playing' && g.runningSince == null ? { ...g, runningSince: action.now } : g
  }
}

export interface Derived {
  conflicts: Set<CellIndex>
  digitCounts: Record<Digit, number>
  isComplete: boolean
  hasProgress: boolean
  highlight: { related: Set<CellIndex>; sameDigit: Set<CellIndex> }
}

export function derive(g: Game): Derived {
  const conflicts = findConflicts(g.values)
  const digitCounts = Object.fromEntries(DIGITS.map((d) => [d, 0])) as Record<Digit, number>
  for (const v of g.values) if (v) digitCounts[v]++
  return {
    conflicts,
    digitCounts,
    isComplete: g.values.every((v) => v !== 0) && conflicts.size === 0,
    hasProgress: g.history.length > 0,
    highlight: highlightOf(g),
  }
}

function highlightOf(g: Game): Derived['highlight'] {
  const related = new Set<CellIndex>()
  const sameDigit = new Set<CellIndex>()
  if (g.selected == null) return { related, sameDigit }
  for (const p of peers(g.selected)) related.add(p)
  const v = g.values[g.selected]
  if (v) g.values.forEach((x, i) => x === v && sameDigit.add(i))
  return { related, sameDigit }
}
