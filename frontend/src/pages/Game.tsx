import { useState, useEffect } from "react";
import type { Board } from "../types/game";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import Button from "../components/Button";
import { findWinningLine } from "../utils/gameUtils";
import { Scoreboard } from "../components/Scoreboard";


export interface Game {
  id: number;
  player1Id: number;
  player2Id: number | null;
  winnerId: number | null;
  boardState: (string | null)[];
  boardSize: number;
  currentTurn: string;
  gameType: "CLASSIC" | "CUSTOM" | "TOURNAMENT" | "AI";
  status: "WAITING" | "IN_PROGRESS" | "FINISHED" | "DRAW" | "CANCELLED";
  settings: Record<string, unknown> | null;
  createdAt: string;
  finishedAt: string | null;
}

/* -------------------  Props du composant  ------------------- */
interface GameStateProps {
  game: Game;
  onUpdate?: (updatedGame: Game) => void;
  id: number | undefined;
  // player1Id: number;
  // player2Id: number | null;
  // winnerId: number | null;
  // boardState: (string | null)[];
  // boardSize: number;
  // currentTurn: string;
  // gameType: "CLASSIC" | "CUSTOM" | "TOURNAMENT" | "AI";
  // status: "WAITING" | "IN_PROGRESS" | "FINISHED" | "DRAW" | "CANCELLED";
  // settings: Record<string, unknown> | null;
  // createdAt: string;
  // finishedAt: string | null;
}

/* -------------------  Composant  ------------------- */
export default function GameState({ 
  game,
  onUpdate,
  // game.id = game.id,
  // player1Id,
  // player2Id,
  // winnerId,
  // boardState,
  // boardSize,
  // currentTurn,
  // gameType,
  // status = "IN_PROGRESS",
  // settings,
  // createdAt,
  // finishedAt
}: GameStateProps) {
 
  let shouldWaitForNewGame: boolean = true; // test to freeze the board

  // game is always undefined for some reason
  if (game?.status != undefined) {
    console.log("GAME STATUS IS " + game.status);
    if (game.status === "FINISHED")
      shouldWaitForNewGame = true;
  }
  else {
    console.log("GAME STATUS IS UNDEFINED");
  }

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");

  function handleCellClick(index: number) {
    if (board[index] !== null) return;

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    const nextPlayer: "X" | "O" = currentPlayer === "X" ? "O" : "X";
    setCurrentPlayer(nextPlayer);

    console.log(
      `[Game] Cell clicked at index ${index}, placed ${currentPlayer}, next player: ${nextPlayer}`,
    );
  }
  // 👉 Si tu veux synchroniser avec le backend :
  // if (onUpdate) {
  //   onUpdate({
  //     ...game,
  //     boardState: nextBoard,
  //     currentTurn: nextPlayer,
  //   });
  // }

  const winningLine = findWinningLine(board);
  const playerSymbol: "X" | "O" = "X";
  const isYourTurn = currentPlayer === playerSymbol;
  // let shouldWaitForNewGame: boolean = false;
  // if (game.status && game.status === "FINISHED")
  //   shouldWaitForNewGame = true;


  return (
    <div className="flex flex-col items-center gap-6">

      <h1 className="text-2xl font-bold text-pong-text -mb-4">Game</h1>
      <h2 className="text-lg font-medium">
        {game?.status}
      </h2>
      
      {/* Turn indicator */}
      {shouldWaitForNewGame
       ? ""
       : <TurnIndicator
        currentPlayer={currentPlayer}
        playerSymbol={playerSymbol}
        isYourTurn={isYourTurn}
        className="-mb-6"
      />}
      
      {/* Board */}
      <GameBoard
      board={board}
      onCellClick={handleCellClick}
      winningLine={winningLine}
      isMyTurn={isYourTurn}
      waitForNewGame={shouldWaitForNewGame}
      />

      <div>
      {shouldWaitForNewGame
        ? <div class="text-center bg-gray-100 bg-opacity-20 backdrop-blur-md  rounded-lg flex justify-self-center flex-col  p-20 w-screen relative">
            <p class= "text-xl font-semibold text-gray-600 mb-2 opacity-100">
              Waiting for opponent to join...
            </p>
            <div class="animate-spin">
              ⏳
            </div>
            <div class="animate-pulse text-gray-500">
              Please wait
            </div>
          
        </div>
        : ""}
      </div>      
      
      
      {/* New / Quit button (placeholders Phase 4) */}
      <div className={`flex gap-5 relative
      ${shouldWaitForNewGame
        ? 'mt-20'
        : 'mt-10'
        }`}>
        <Button variant="primary">
          New Game
        </Button>
        <Button variant="danger">
          Quit Game
        </Button>
      </div>
      
      
      {/* Scoreboard / Player vs Player */}
      <div className="rounded-lg bg-pong-surface px-12 py-2 shadow-sm">
        <Scoreboard isMyTurn={isYourTurn} waitForNewGame={shouldWaitForNewGame}></Scoreboard>
      </div>
    </div>
  );
}
