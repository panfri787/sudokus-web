import { countSolutions } from './solver'
import { findConflicts } from './rules'
import {
  CELLS,
  isDigit,
  type CellSnapshot,
  type CellValue,
  type Difficulty,
  type Game,
  type Grid,
  type Move,
} from './types'

/** Formato en `localStorage` (contracts/storage-schema.md). */
export interface StoredGame {
  schema: 1
  puzzle: { givens: string; solution: string; difficulty: Difficulty; seed: number }
  values: string
  notes: number[]
  notesMode: boolean
  history: Move[]
  status: 'playing' | 'won'
  elapsedMs: number
  startedAt: number
}

const LEVELS: readonly unknown[] = ['easy', 'medium', 'hard']
const KINDS: readonly unknown[] = ['set', 'erase', 'toggleNote']

const gridToString = (g: Grid) => g.join('')

function parseGrid(s: unknown, allowEmpty: boolean): CellValue[] | null {
  if (typeof s !== 'string' || s.length !== CELLS) return null
  const re = allowEmpty ? /^[0-9]+$/ : /^[1-9]+$/
  return re.test(s) ? ([...s].map(Number) as CellValue[]) : null
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const isCell = (x: unknown): x is number =>
  Number.isInteger(x) && (x as number) >= 0 && (x as number) < CELLS
const isMask = (x: unknown): x is number =>
  Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 511
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0

function parseSnapshot(x: unknown): CellSnapshot | null {
  if (!isObject(x) || !isCell(x.cell) || !isMask(x.notes)) return null
  if (x.value !== 0 && !isDigit(x.value)) return null
  return { cell: x.cell, value: x.value as CellValue, notes: x.notes }
}

function parseMove(x: unknown): Move | null {
  if (!isObject(x) || !KINDS.includes(x.kind) || !isCell(x.cell)) return null
  if (x.digit !== null && !isDigit(x.digit)) return null
  if (!Array.isArray(x.before) || x.before.length === 0) return null
  const before = x.before.map(parseSnapshot)
  if (before.some((s) => s === null)) return null
  return {
    kind: x.kind as Move['kind'],
    cell: x.cell,
    digit: x.digit,
    before: before as CellSnapshot[],
  }
}

/** Serializa la partida; el tramo en marcha del cronómetro se suma a `elapsedMs`. */
export function toStored(game: Game, now: number): StoredGame {
  const running = game.runningSince == null ? 0 : Math.max(0, now - game.runningSince)
  return {
    schema: 1,
    puzzle: {
      givens: gridToString(game.puzzle.givens),
      solution: gridToString(game.puzzle.solution),
      difficulty: game.puzzle.difficulty,
      seed: game.puzzle.seed,
    },
    values: gridToString(game.values),
    notes: [...game.notes],
    notesMode: game.notesMode,
    history: game.history.map((m) => ({ ...m, before: m.before.map((s) => ({ ...s })) })),
    status: game.status,
    elapsedMs: game.elapsedMs + running,
    startedAt: game.startedAt,
  }
}

/** Valida y reconstruye una partida guardada; `null` ante cualquier dato inválido. */
export function fromStored(data: unknown): Game | null {
  if (!isObject(data) || data.schema !== 1 || !isObject(data.puzzle)) return null
  const p = data.puzzle
  const givens = parseGrid(p.givens, true)
  const solution = parseGrid(p.solution, false)
  const values = parseGrid(data.values, true)
  if (!givens || !solution || !values) return null
  if (!LEVELS.includes(p.difficulty) || !Number.isInteger(p.seed)) return null
  if (data.status !== 'playing' && data.status !== 'won') return null
  if (typeof data.notesMode !== 'boolean' || !isTime(data.elapsedMs) || !isTime(data.startedAt))
    return null

  // La solución debe ser válida, coincidir con las pistas y ser la única.
  if (findConflicts(solution).size > 0) return null
  if (givens.some((v, i) => v !== 0 && v !== solution[i])) return null
  if (countSolutions(givens, 2) !== 1) return null
  if (givens.some((v, i) => v !== 0 && values[i] !== v)) return null

  const notes = data.notes
  if (!Array.isArray(notes) || notes.length !== CELLS || !notes.every(isMask)) return null
  if (notes.some((n, i) => n !== 0 && (givens[i] !== 0 || values[i] !== 0))) return null

  if (!Array.isArray(data.history)) return null
  const history = data.history.map(parseMove)
  if (history.some((m) => m === null)) return null

  return {
    puzzle: {
      givens,
      solution,
      difficulty: p.difficulty as Difficulty,
      seed: p.seed as number,
    },
    values,
    notes: notes as number[],
    selected: null,
    notesMode: data.notesMode,
    history: history as Move[],
    status: data.status,
    elapsedMs: data.elapsedMs,
    runningSince: null,
    startedAt: data.startedAt,
  }
}
