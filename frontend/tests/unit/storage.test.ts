import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from '../../src/state/storage'

function fakeStorage(overrides: Partial<Storage> = {}): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
    ...overrides,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('readJson', () => {
  it('devuelve null si la clave no existe', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(readJson('x')).toBeNull()
  })

  it('devuelve null si el JSON es inválido', () => {
    const s = fakeStorage()
    s.setItem('x', '{roto')
    vi.stubGlobal('localStorage', s)
    expect(readJson('x')).toBeNull()
  })

  it('devuelve null si getItem lanza', () => {
    vi.stubGlobal(
      'localStorage',
      fakeStorage({
        getItem: () => {
          throw new Error('SecurityError')
        },
      }),
    )
    expect(readJson('x')).toBeNull()
  })

  it('devuelve null si localStorage no existe', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readJson('x')).toBeNull()
  })

  it('lee lo que escribe writeJson', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    writeJson('x', { a: 1 })
    expect(readJson('x')).toEqual({ a: 1 })
  })
})

describe('writeJson', () => {
  it('no lanza si setItem lanza', () => {
    vi.stubGlobal(
      'localStorage',
      fakeStorage({
        setItem: () => {
          throw new Error('QuotaExceededError')
        },
      }),
    )
    expect(() => writeJson('x', { a: 1 })).not.toThrow()
  })
})
