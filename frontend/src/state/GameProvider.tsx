import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import {
  derive,
  gameReducer,
  newGame,
  type Difficulty,
  type Game,
  type GameAction,
} from '../domain'
import { GameContext } from './gameContext'
import { usePuzzleSource } from './usePuzzleSource'

type ProviderAction = GameAction | { type: 'load'; game: Game }

function providerReducer(state: Game | null, action: ProviderAction): Game | null {
  if (action.type === 'load') return action.game
  return state && gameReducer(state, action)
}

/** Acciones del jugador que cierran un tramo del cronómetro antes de aplicarse. */
const TIMED: ReadonlySet<GameAction['type']> = new Set(['input', 'erase', 'undo'])

interface Props {
  children: ReactNode
  /** Partida inicial (pruebas); si falta, se genera una. */
  initialGame?: Game
}

export function GameProvider({ children, initialGame }: Props) {
  const [game, rawDispatch] = useReducer(providerReducer, initialGame ?? null)
  const [pending, setPending] = useState<Difficulty | null>(initialGame ? null : 'medium')
  const source = usePuzzleSource()

  const dispatch = useCallback((action: GameAction) => {
    if (TIMED.has(action.type)) rawDispatch({ type: 'tick', now: Date.now() })
    rawDispatch(action)
  }, [])

  const startNewGame = useCallback((difficulty: Difficulty) => setPending(difficulty), [])

  // Generación: cuando hay un nivel pendiente y la fuente está lista.
  useEffect(() => {
    if (!pending) return
    let cancelled = false
    source.request(pending).then((sudoku) => {
      if (cancelled) return
      rawDispatch({ type: 'load', game: newGame(sudoku, Date.now()) })
      setPending(null)
    })
    return () => {
      cancelled = true
    }
  }, [pending, source])

  // Cronómetro: un tick por segundo mientras corre.
  const running = game?.status === 'playing' && game.runningSince != null
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => rawDispatch({ type: 'tick', now: Date.now() }), 1000)
    return () => clearInterval(id)
  }, [running])

  // Pausa con la página oculta (FR-008).
  useEffect(() => {
    const onVisibility = () =>
      rawDispatch({
        type: document.visibilityState === 'hidden' ? 'pause' : 'resume',
        now: Date.now(),
      })
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const derived = useMemo(() => (game ? derive(game) : null), [game])

  const value = useMemo(
    () => ({ game, derived, generating: pending != null, dispatch, startNewGame }),
    [game, derived, pending, dispatch, startNewGame],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
