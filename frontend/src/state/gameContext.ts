import { createContext, useContext } from 'react'
import type { Derived, Difficulty, Game, GameAction } from '../domain'

export interface GameContextValue {
  game: Game | null
  derived: Derived | null
  generating: boolean
  dispatch: (action: GameAction) => void
  startNewGame: (difficulty: Difficulty) => void
}

export const GameContext = createContext<GameContextValue | null>(null)

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame fuera de GameProvider')
  return ctx
}
