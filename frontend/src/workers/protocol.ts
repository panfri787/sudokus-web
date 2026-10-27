import type { Difficulty, Sudoku } from '../domain'

export interface GenerateRequest {
  id: number
  difficulty: Difficulty
  seed: number
}

export type GenerateResponse =
  | { id: number; ok: true; sudoku: Sudoku; durationMs: number }
  | { id: number; ok: false; error: string }
