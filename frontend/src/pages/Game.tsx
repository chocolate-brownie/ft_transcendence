import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { GameOverPlayerSummary } from "../types/game";
import { useSocket } from "../context/SocketContext";
import { ApiError } from "../lib/apiClient";
import { gamesService } from "../services/games.service";

import Button from "../components/Button";
import GameOverModal from "../components/Game/GameOverModal";
import GameBoard from "../components/Game/GameBoard";
import Scoreboard from "../components/Game/Scoreboard";
import TurnIndicator from "../components/Game/TurnIndicator";
import { findWinningLine } from "../utils/gameUtils";

import { gameReducer, initialGameState } from "./game/state";
import { useGameSocketController } from "./game/useGameSocketController";

export default function Game() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { socket } = useSocket();

  const gameId = Number(id);

  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [joinRevision, setJoinRevision] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const { emitLeaveRoomOnce } = useGameSocketController({
    socket,
    gameId,
    joinRevision,
    navigate,
    dispatch,
    stateRef,
  });

  useEffect(() => {
    if (gameState.startedAtMs === null || gameState.serverStatus !== "IN_PROGRESS") {
      return;
    }

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - gameState.startedAtMs!) / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [gameState.startedAtMs, gameState.serverStatus]);

  useEffect(() => {
    if (gameState.opponentConnection !== "disconnected") return;
    if (gameState.disconnectCountdown === null || gameState.disconnectCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      dispatch({ type: "DISCONNECT_COUNTDOWN_TICK" });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [gameState.opponentConnection, gameState.disconnectCountdown]);

  function handleCellClick(index: number) {
    if (gameState.board[index] !== null) return;
    if (!socket) return;
    if (gameState.status !== "ready") return;
    if (gameState.isSendingMove) return;
    if (gameState.serverStatus !== "IN_PROGRESS") return;
    if (gameState.currentTurn !== gameState.yourSymbol) return;

    dispatch({ type: "BEGIN_MOVE_SEND" });
    socket.emit("make_move", { gameId, cellIndex: index });
  }

  function backToLobby() {
    emitLeaveRoomOnce();
    void navigate("/lobby");
  }

  function goHome() {
    emitLeaveRoomOnce();
    void navigate("/");
  }

  function handlePlayAgain() {
    emitLeaveRoomOnce();
  void navigate("/matchmaking");
  }

  //  Old version, createNewgame

  /*async function handlePlayAgain() {
    if (!gameState.gameOverPayload || gameState.isCreatingRematch) return;

    const opponentId =
      gameState.gameOverPayload.winner?.symbol === gameState.yourSymbol
        ? gameState.gameOverPayload.loser?.id
        : gameState.gameOverPayload.winner?.id;

    if (!opponentId) {
      dispatch({ type: "REMATCH_OPPONENT_MISSING" });
      return;
    }

    dispatch({ type: "REMATCH_REQUEST_START" });

    try {
      const newGame = await gamesService.createGame({
        player2Id: opponentId,
        sourceGameId: gameId,
      });

      socket?.emit("send_rematch", { gameId, newGameId: newGame.id });
      void navigate(`/game/${newGame.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create rematch. Please retry.";
      dispatch({ type: "REMATCH_REQUEST_FAILED", message });
    }
  }*/

  function handleRetry() {
    if (!navigator.onLine) {
      dispatch({ type: "RETRY_OFFLINE" });
      return;
    }
    if (!socket) {
      dispatch({ type: "RETRY_SOCKET_UNAVAILABLE" });
      return;
    }

    dispatch({ type: "RETRY_RESET" });
    setJoinRevision((n) => n + 1);

    if (!socket.connected) {
      dispatch({ type: "JOIN_CONNECTING" });
      socket.connect();
    } else {
      dispatch({ type: "RETRY_READY" });
    }
  }

  const myPlayer =
    gameState.yourSymbol === gameState.player1Symbol
      ? gameState.player1
      : gameState.yourSymbol === gameState.player2Symbol
        ? gameState.player2
        : null;
  const opponentPlayer =
    myPlayer?.id === gameState.player1?.id
      ? gameState.player2
      : myPlayer?.id === gameState.player2?.id
        ? gameState.player1
        : null;
  const opponentSummary: GameOverPlayerSummary | null = opponentPlayer
    ? {
        id: opponentPlayer.id,
        username: opponentPlayer.username,
        symbol:
          opponentPlayer.id === gameState.player1?.id
            ? gameState.player1Symbol
            : gameState.player2Symbol,
      }
    : null;
  const opponentAvatarUrl = opponentPlayer?.avatarUrl ?? null;

  const isYourTurn =
    gameState.status === "ready" &&
    gameState.serverStatus === "IN_PROGRESS" &&
    gameState.currentTurn === gameState.yourSymbol;
  const boardDisabled =
    !isYourTurn || gameState.isSendingMove || gameState.opponentConnection === "disconnected";
  const winningLine = gameState.serverWinningLine || findWinningLine(gameState.board);
  const moveCount = gameState.board.filter((cell) => cell !== null).length;
  const gameClock = gameState.gameOverPayload?.duration ?? elapsedSeconds;
  const isGameOver = gameState.serverStatus === "FINISHED" || gameState.serverStatus === "DRAW";
  const winnerSymbol =
    gameState.gameOverPayload?.winner?.symbol ??
    (isGameOver && winningLine ? gameState.board[winningLine[0]] : null);
  const waitingText = gameId > 0 ? `Waiting for opponent in game #${gameId}…` : "Waiting for opponent…";
  const gameOverText = gameState.gameResultText ? `Game over: ${gameState.gameResultText}` : "Game over";
  const player1Score = gameState.gameOverPayload?.winner?.symbol === gameState.player1Symbol ? 1 : 0;
  const player2Score = gameState.gameOverPayload?.winner?.symbol === gameState.player2Symbol ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-pong-text -mb-4">
        {gameId > 0 ? `Game #${gameId}` : "Game"}
      </h1>

      {gameState.error ? (
        <div className="w-full max-w-lg rounded-lg bg-pong-surface px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-red-400">Game error</p>
          <p className="mt-2 text-sm text-pong-text/70">{gameState.error}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleRetry}>
              Try again
            </Button>
            <Button variant="secondary" className="flex-1" onClick={backToLobby}>
              Back to Lobby
            </Button>
          </div>
        </div>
      ) : gameState.status === "connecting" ? (
        <p className="animate-pulse text-sm text-pong-text/60">Connecting…</p>
      ) : gameState.status === "joining" ? (
        <p className="animate-pulse text-sm text-pong-text/60">Joining game…</p>
      ) : gameState.status !== "ready" ? (
        <p className="animate-pulse text-sm text-pong-text/60">Loading game…</p>
      ) : null}

      {gameState.serverStatus === "WAITING" ? (
        <div className="w-full max-w-xl rounded-lg border border-black/10 bg-pong-surface px-6 py-4 text-center">
          <p className="text-base font-semibold text-pong-text">{waitingText}</p>
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-pong-text/60">
            <span className="h-2 w-2 animate-pulse rounded-full bg-pong-accent" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-pong-secondary [animation-delay:180ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-pong-accent [animation-delay:360ms]" />
            <span>Waiting for second player</span>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={backToLobby}>
              Cancel Game
            </Button>
          </div>
        </div>
      ) : null}

      {gameState.opponentConnection === "disconnected" ? (
        <div
          className="w-full max-w-xl rounded-lg border border-carrot-orange-400 bg-carrot-orange-100 px-5 py-3 text-pong-text"
          data-testid="opponent-disconnected-banner"
        >
          <p className="text-sm font-semibold text-carrot-orange-700">
            {gameState.disconnectedOpponentName ?? "Opponent"} disconnected.
          </p>
          <p className="text-xs text-pong-text/80">
            Waiting for reconnection
            {typeof gameState.disconnectCountdown === "number"
              ? ` (${gameState.disconnectCountdown}s)`
              : ""}
            .
          </p>
        </div>
      ) : null}

      <TurnIndicator
        currentPlayer={gameState.currentTurn}
        playerSymbol={gameState.yourSymbol}
        isYourTurn={isYourTurn}
        className="-mb-6"
        textOverride={
          gameState.serverStatus === "WAITING"
            ? waitingText
            : gameState.serverStatus === "FINISHED" || gameState.serverStatus === "DRAW"
              ? gameOverText
              : undefined
        }
      />

      <Scoreboard
        player1={gameState.player1}
        player2={gameState.player2}
        player1Symbol={gameState.player1Symbol}
        player2Symbol={gameState.player2Symbol}
        currentTurn={gameState.currentTurn}
        serverStatus={gameState.serverStatus}
        player1Score={player1Score}
        player2Score={player2Score}
      />

      <div className="flex items-center gap-3 text-xs text-pong-text/60">
        <span>Move {moveCount} / 9</span>
        <span className="opacity-40">·</span>
        <span>
          ⏱ {Math.floor(gameClock / 60)}:{String(gameClock % 60).padStart(2, "0")}
        </span>
      </div>

      {isGameOver ? (
        <div
          className={`rounded-lg border px-5 py-3 text-center ${
            gameState.serverStatus === "DRAW"
              ? "border-slate-300/40 bg-slate-300/10 text-pong-text/90"
              : gameState.gameResultText === "You won"
                ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-300"
                : "border-red-300/50 bg-red-400/10 text-red-300"
          }`}
        >
          <p className="text-2xl font-bold">
            {gameState.serverStatus === "DRAW"
              ? "It's a Draw! 🤝"
              : gameState.gameResultText === "You won"
                ? "You Won! 🎉"
                : "You Lost 😢"}
          </p>
        </div>
      ) : null}

      {gameState.moveError ? <p className="-mt-4 text-xs text-red-400">{gameState.moveError}</p> : null}
      {gameState.isSendingMove ? (
        <p className="-mt-4 text-xs text-pong-text/60">Sending move…</p>
      ) : null}

      <GameBoard
        board={gameState.board}
        onCellClick={handleCellClick}
        currentTurnSymbol={gameState.currentTurn}
        winningLine={winningLine}
        winnerSymbol={winnerSymbol === "X" || winnerSymbol === "O" ? winnerSymbol : null}
        playerSymbol={gameState.yourSymbol}
        gameOver={isGameOver}
        disabled={boardDisabled}
      />

      {isGameOver && gameState.gameOverPayload && !gameState.showGameOverModal ? (
        <Button variant="secondary" onClick={() => dispatch({ type: "OPEN_GAME_OVER_MODAL" })}>
          View Result
        </Button>
      ) : null}

      <GameOverModal
        open={gameState.showGameOverModal && !!gameState.gameOverPayload}
        result={gameState.gameOverPayload?.result ?? "draw"}
        winner={gameState.gameOverPayload?.winner ?? null}
        loser={gameState.gameOverPayload?.loser ?? null}
        opponent={opponentSummary}
        mySymbol={gameState.yourSymbol}
        totalMoves={
          gameState.gameOverPayload?.totalMoves ?? gameState.board.filter((cell) => cell !== null).length
        }
        durationSeconds={gameState.gameOverPayload?.duration}
        opponentAvatarUrl={opponentAvatarUrl}
        rematchLoading={gameState.isCreatingRematch}
        rematchError={gameState.rematchError}
        onPlayAgain={() => {
          void handlePlayAgain();
        }}
        onGoLobby={backToLobby}
        onGoHome={goHome}
        onClose={() => dispatch({ type: "CLOSE_GAME_OVER_MODAL" })}
      />
    </div>
  );
}
