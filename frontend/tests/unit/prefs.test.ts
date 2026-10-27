import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPrefs, savePrefs } from '../../src/state/prefs'
import { PREFS_KEY } from '../../src/state/storage'

let data: Map<string, string>

beforeEach(() => {
  data = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('loadPrefs', () => {
  it('por defecto, nivel medio', () => {
    expect(loadPrefs()).toEqual({ lastDifficulty: 'medium' })
  })

  it.each([
    ['schema distinto', { schema: 2, lastDifficulty: 'hard' }],
    ['nivel inválido', { schema: 1, lastDifficulty: 'extreme' }],
    ['no es objeto', 'hard'],
  ])('ignora datos inválidos (%s)', (_, stored) => {
    data.set(PREFS_KEY, JSON.stringify(stored))
    expect(loadPrefs()).toEqual({ lastDifficulty: 'medium' })
  })

  it('lee el último nivel guardado', () => {
    data.set(PREFS_KEY, JSON.stringify({ schema: 1, lastDifficulty: 'easy' }))
    expect(loadPrefs()).toEqual({ lastDifficulty: 'easy' })
  })
})

describe('savePrefs', () => {
  it('escribe el formato StoredPrefs', () => {
    savePrefs({ lastDifficulty: 'hard' })
    expect(JSON.parse(data.get(PREFS_KEY)!)).toEqual({ schema: 1, lastDifficulty: 'hard' })
  })
})
