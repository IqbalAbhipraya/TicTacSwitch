import { useState } from 'react'
import './App.css'
import Board from './components/Board'
import type { GameState, Player } from './types'

function App() {
  //TODO: test the board component
  const gameState: GameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    moveHistoryX: [],
    moveHistoryO: [],
    winner: null,
  }
  const onSquareClick = (index: number) => {
    console.log(`Square ${index} clicked`)
  }
  const myRole: Player = 'X'
  return (
    <>
      <Board gameState={gameState} onSquareClick={onSquareClick} myRole={myRole} />
    </>
  )
}

export default App
