import { useEffect, useState } from 'react'
import { generateSudoku, randomSeed, type Difficulty, type Sudoku } from '../domain'
import type { GenerateRequest, GenerateResponse } from '../workers/protocol'

export interface PuzzleSource {
  /** Devuelve un sudoku del nivel pedido (pregenerado si lo hay). */
  request(difficulty: Difficulty): Promise<Sudoku>
  dispose(): void
}

/** Semilla de prueba `?seed=N`: solo afecta al primer puzle de la carga. */
function takeTestSeed(): number | null {
  const raw = new URLSearchParams(globalThis.location?.search ?? '').get('seed')
  const n = raw == null ? NaN : Number(raw)
  return Number.isInteger(n) && n >= 0 ? n >>> 0 : null
}

export function createPuzzleSource(): PuzzleSource {
  let worker: Worker | null = null
  let workerFailed = false
  let nextId = 1
  const pending = new Map<number, (r: GenerateResponse | null) => void>()
  let prefetched: { difficulty: Difficulty; promise: Promise<Sudoku> } | null = null
  let testSeed = takeTestSeed()

  const failAll = () => {
    for (const resolve of pending.values()) resolve(null)
    pending.clear()
    worker?.terminate()
    worker = null
  }

  /** Crea el worker bajo demanda (y de nuevo tras `dispose`). */
  const getWorker = (): Worker | null => {
    if (worker || workerFailed) return worker
    try {
      worker = new Worker(new URL('../workers/generator.worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch {
      workerFailed = true
      return null
    }
    worker.onmessage = (e: MessageEvent<GenerateResponse>) => {
      const resolve = pending.get(e.data.id)
      pending.delete(e.data.id)
      resolve?.(e.data)
    }
    worker.onerror = () => {
      workerFailed = true
      failAll()
    }
    return worker
  }

  const viaWorker = (difficulty: Difficulty, seed: number): Promise<GenerateResponse | null> => {
    const w = getWorker()
    if (!w) return Promise.resolve(null)
    const id = nextId++
    return new Promise((resolve) => {
      pending.set(id, resolve)
      w.postMessage({ id, difficulty, seed } satisfies GenerateRequest)
    })
  }

  const generate = async (difficulty: Difficulty, seed: number): Promise<Sudoku> => {
    const first = await viaWorker(difficulty, seed)
    if (first?.ok) return first.sudoku
    if (first && !first.ok) {
      const retry = await viaWorker(difficulty, randomSeed())
      if (retry?.ok) return retry.sudoku
    }
    // Respaldo síncrono en el hilo principal.
    return generateSudoku(difficulty, first ? randomSeed() : seed)
  }

  const prefetch = (difficulty: Difficulty) => {
    const promise = generate(difficulty, randomSeed())
    promise.catch(() => {})
    prefetched = { difficulty, promise }
  }

  return {
    async request(difficulty) {
      let promise: Promise<Sudoku>
      if (testSeed != null) {
        promise = generate(difficulty, testSeed)
        testSeed = null
      } else if (prefetched?.difficulty === difficulty) {
        promise = prefetched.promise
      } else {
        promise = generate(difficulty, randomSeed())
      }
      prefetched = null
      const sudoku = await promise
      prefetch(difficulty)
      return sudoku
    },
    dispose() {
      failAll()
      prefetched = null
    },
  }
}

/** Fuente de sudokus ligada al ciclo de vida del componente. */
export function usePuzzleSource(): PuzzleSource {
  const [source] = useState(createPuzzleSource)
  useEffect(() => () => source.dispose(), [source])
  return source
}
