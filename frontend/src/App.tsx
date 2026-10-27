import { useState } from 'react'
import { Board } from './components/Board'
import { ConfirmDialog } from './components/dialogs/ConfirmDialog'
import { NewGameDialog } from './components/dialogs/NewGameDialog'
import { WinDialog } from './components/dialogs/WinDialog'
import { NumberPad } from './components/NumberPad'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { es } from './i18n/es'
import { GameProvider } from './state/GameProvider'
import { useGame } from './state/gameContext'
import { useKeyboard } from './state/useKeyboard'

type DialogState = 'none' | 'confirm' | 'level'

export function GameView() {
  const { game, derived, generating, dispatch, startNewGame } = useGame()
  const [dialog, setDialog] = useState<DialogState>('none')
  useKeyboard(game, dispatch, dialog === 'none' && game?.status === 'playing' && !generating)

  const requestNewGame = () => {
    setDialog(derived?.hasProgress && game?.status === 'playing' ? 'confirm' : 'level')
  }

  return (
    <main className="app">
      <StatusBar />
      <div className="board-area">
        <Board />
        {(!game || generating) && (
          <div className="loading" role="status">
            {es.generating}
          </div>
        )}
      </div>
      <div className="side">
        <StatusBar />
        <Toolbar onNewGame={requestNewGame} />
        <NumberPad />
      </div>

      {dialog === 'confirm' && (
        <ConfirmDialog onConfirm={() => setDialog('level')} onCancel={() => setDialog('none')} />
      )}
      {dialog === 'level' && (
        <NewGameDialog
          onChoose={(level) => {
            setDialog('none')
            startNewGame(level)
          }}
          onCancel={() => setDialog('none')}
        />
      )}
      {game?.status === 'won' && !generating && dialog === 'none' && (
        <WinDialog elapsedMs={game.elapsedMs} onNewGame={() => setDialog('level')} />
      )}
    </main>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameView />
    </GameProvider>
  )
}
