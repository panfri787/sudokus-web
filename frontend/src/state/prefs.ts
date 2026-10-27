import type { Difficulty } from '../domain'
import { PREFS_KEY, readJson, writeJson } from './storage'

export interface Prefs {
  lastDifficulty: Difficulty
}

const LEVELS: readonly Difficulty[] = ['easy', 'medium', 'hard']
const DEFAULT: Prefs = { lastDifficulty: 'medium' }

export function loadPrefs(): Prefs {
  const raw = readJson<{ schema?: unknown; lastDifficulty?: unknown }>(PREFS_KEY)
  if (!raw || typeof raw !== 'object' || raw.schema !== 1) return DEFAULT
  const d = raw.lastDifficulty
  return LEVELS.includes(d as Difficulty) ? { lastDifficulty: d as Difficulty } : DEFAULT
}

export function savePrefs(prefs: Prefs): void {
  writeJson(PREFS_KEY, { schema: 1, lastDifficulty: prefs.lastDifficulty })
}
