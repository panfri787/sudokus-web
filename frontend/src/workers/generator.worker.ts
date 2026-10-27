/// <reference lib="webworker" />
import { generateSudoku } from '../domain'
import type { GenerateRequest, GenerateResponse } from './protocol'

declare const self: DedicatedWorkerGlobalScope

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { id, difficulty, seed } = event.data
  const t0 = performance.now()
  let response: GenerateResponse
  try {
    const sudoku = generateSudoku(difficulty, seed)
    response = { id, ok: true, sudoku, durationMs: performance.now() - t0 }
  } catch (err) {
    response = { id, ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  self.postMessage(response)
}
