import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Board } from "../types/game";
import { useSocket } from "../context/SocketContext";
import { ApiError } from "../lib/apiClient";
import { gamesService } from "../services/games.service";

import Button from "../components/Button";
import GameOverModal from "../components/Game/GameOverModal";
import GameBoard from "../components/Game/GameBoard";
import TurnIndicator from "../components/Game/TurnIndicator";
import { findWinningLine } from "../utils/gameUtils";

type Symbol = "X" | "O";
type ServerStatus = "WAITING" | "IN_PROGRESS" | "FINISHED" | "DRAW" | "CANCELLED";

type RoomJoined = {
  gameId: number;
  game: {
    boardState: Board;
    currentTurn: Symbol;
    status: ServerStatus;
    yourSymbol: Symbol;
  };
};

type GameUpdate = {
  gameId: number;
  board: Board;
  currentTurn: Symbol;
  status: ServerStatus;
  winningLine?: number[];
};

type GameOver = {
  gameId: number;
  finalBoard: Board;
  result: "win" | "draw";
  winner?: {
    id: number;
    username: string;
    symbol: Symbol;
  } | null;
  loser?: {
    id: number;
    username: string;
    symbol: Symbol;
  } | null;
  totalMoves?: number;
  duration?: number;
  winningLine?: number[] | null;
};

type MoveError = {
  error: string;
};

export default function Game() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { socket } = useSocket();

  const gameId = Number(id);

  const [status, setStatus] = useState<"idle" | "connecting" | "joining" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<Symbol>("X");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("WAITING");
  const [yourSymbol, setYourSymbol] = useState<Symbol>("X");

  const [serverWinningLine, setServerWinningLine] = useState<number[] | null>(null);
  const [isSendingMove, setIsSendingMove] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [gameResultText, setGameResultText] = useState<string | null>(null);
  const [gameOverPayload, setGameOverPayload] = useState<GameOver | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isCreatingRematch, setIsCreatingRematch] = useState(false);
  const [rematchError, setRematchError] = useState<string | null>(null);

  const joinedRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    function onRoomJoined({ gameId: joinedId, game }: RoomJoined) {
      if (joinedId !== gameId) return;

      setBoard(game.boardState);
      setCurrentTurn(game.currentTurn);
      setServerStatus(game.status);
      setYourSymbol(game.yourSymbol);

      setServerWinningLine(null);
      setIsSendingMove(false);
      setMoveError(null);
      setGameResultText(null);
      setGameOverPayload(null);
      setShowGameOverModal(false);
      setIsCreatingRematch(false);
      setRematchError(null);
      setError(null);
      setStatus("ready");
    }

    function onGameUpdate({
      gameId: updateId,
      board,
      currentTurn,
      status,
      winningLine,
    }: GameUpdate) {
      if (updateId !== gameId) return;

      setBoard(board);
      setCurrentTurn(currentTurn);
      setServerStatus(status);
      setServerWinningLine(winningLine ?? null);

      setIsSendingMove(false);
      setMoveError(null);
    }

    function onGameOver({
      gameId: overId,
      finalBoard,
      result,
      winner,
      loser,
      totalMoves,
      duration,
      winningLine,
    }: GameOver) {
      if (overId !== gameId) return;

      setBoard(finalBoard);
      setServerStatus(result === "draw" ? "DRAW" : "FINISHED");
      setGameResultText(
        result === "draw"
          ? "Draw game"
          : winner?.symbol === yourSymbol
            ? "You won"
            : "You lost",
      );
      setServerWinningLine(winningLine ?? null);
      setGameOverPayload({
        gameId: overId,
        finalBoard,
        result,
        winner,
        loser,
        totalMoves,
        duration,
        winningLine,
      });
      setShowGameOverModal(true);
      setRematchError(null);

      setIsSendingMove(false);
      setMoveError(null);
    }

    function onMoveError({ error }: MoveError) {
      setIsSendingMove(false);
      setMoveError(error);
    }

    function onError({ gameId: eventGameId, message }: { gameId?: number; message?: string }) {
      if (typeof eventGameId === "number" && eventGameId !== gameId) return;

      const userMessage = message || "Something went wrong.";
      setIsSendingMove(false);
      if (status === "ready") {
        setMoveError(userMessage);
        return;
      }

      setMoveError(null);
      setError(userMessage);
      setStatus("idle");
    }

    function onDisconnect() {
      setIsSendingMove(false);
      setMoveError(null);
      setError("Connection lost. Please check your network and try again.");
      setStatus("idle");
    }

    socket.on("room_joined", onRoomJoined);
    socket.on("game_update", onGameUpdate);
    socket.on("game_over", onGameOver);
    socket.on("move_error", onMoveError);
    socket.on("error", onError);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("game_update", onGameUpdate);
      socket.off("game_over", onGameOver);
      socket.off("move_error", onMoveError);
      socket.off("error", onError);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, gameId, status, yourSymbol]);


  useEffect(() => {
    function startJoin() {
      if (!socket || joinedRef.current) return;
      joinedRef.current = true;

      setError(null);
      setMoveError(null);
      setIsSendingMove(false);
      setStatus("joining");

      socket.emit("join_game_room", { gameId });
    }

    if (joinedRef.current) return;

    if (!gameId) {
      setError("Invalid game id in URL.");
      setStatus("idle");
      return;
    }

    if (!socket) {
      setStatus("connecting");
      return;
    }

    if (!socket.connected) {
      setStatus("connecting");
      socket.once("connect", startJoin);
      socket.connect();
      return () => {
        socket.off("connect", startJoin);
      };
    }

    startJoin();
  }, [socket, gameId]);


  useEffect(() => {
    return () => {
      if (!socket) return;
      if (!gameId) return;
      socket.emit("leave_game_room", { gameId });
    };
  }, [socket, gameId]);

  function handleCellClick(index: number) {
    if (board[index] !== null) return;
    if (!socket) return;
    if (status !== "ready") return;
    if (isSendingMove) return;
    if (serverStatus !== "IN_PROGRESS") return;
    if (currentTurn !== yourSymbol) return;

    setIsSendingMove(true);
    setMoveError(null);

    socket.emit("make_move", { gameId, cellIndex: index });
  }

  function backToLobby() {
    if (socket && gameId) socket.emit("leave_game_room", { gameId });
    void navigate("/lobby");
  }

  function goHome() {
    if (socket && gameId) socket.emit("leave_game_room", { gameId });
    void navigate("/");
  }

  async function handlePlayAgain() {
    if (!gameOverPayload || isCreatingRematch) return;

    const opponentId =
      gameOverPayload.winner?.symbol === yourSymbol
        ? gameOverPayload.loser?.id
        : gameOverPayload.winner?.id;

    if (!opponentId) {
      setRematchError("Unable to identify opponent for rematch.");
      return;
    }

    setIsCreatingRematch(true);
    setRematchError(null);

    try {
      const newGame = await gamesService.createGame({ player2Id: opponentId });
      if (socket && gameId) socket.emit("leave_game_room", { gameId });
      void navigate(`/game/${newGame.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create rematch. Please retry.";
      setRematchError(message);
      setIsCreatingRematch(false);
    }
  }

  function handleRetry() {
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet then try again.");
      return;
    }
    if (!socket) {
      setStatus("connecting");
      setError("Still connecting to server. Please try again in a moment.");
      return;
    }
    if (!socket.connected) {
      socket.connect();
      setStatus("connecting");
      setError("Reconnecting to server. Please try again in a moment.");
      return;
    }

    joinedRef.current = false;
    setError(null);
    setMoveError(null);
    setIsSendingMove(false);
    setStatus("idle");
  }

  const isYourTurn = status === "ready" && serverStatus === "IN_PROGRESS" && currentTurn === yourSymbol;
  const boardDisabled = !isYourTurn || isSendingMove;
  const winningLine = serverWinningLine || findWinningLine(board);
  const waitingText =
    gameId > 0 ? `Waiting for opponent in game #${gameId}…` : "Waiting for opponent…";
  const gameOverText = gameResultText ? `Game over: ${gameResultText}` : "Game over";

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-pong-text -mb-4">Game</h1>

      {/* Simple status / error (no new layout) */}
      {error ? (
        <div className="w-full max-w-lg rounded-lg bg-pong-surface px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-red-400">Game error</p>
          <p className="mt-2 text-sm text-pong-text/70">{error}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleRetry}>
              Try again
            </Button>
            <Button variant="secondary" className="flex-1" onClick={backToLobby}>
              Back to Lobby
            </Button>
          </div>
        </div>
      ) : status === "connecting" ? (
        <p className="text-sm text-pong-text/60">Connecting…</p>
      ) : status === "joining" ? (
        <p className="text-sm text-pong-text/60">Joining game…</p>
      ) : status !== "ready" ? (
        <p className="text-sm text-pong-text/60">Loading game…</p>
      ) : null}

      {/* Turn indicator */}
      <TurnIndicator
        currentPlayer={currentTurn}
        playerSymbol={yourSymbol}
        isYourTurn={isYourTurn}
        className="-mb-6"
        textOverride={
          serverStatus === "WAITING"
            ? waitingText
            : serverStatus === "FINISHED" || serverStatus === "DRAW"
            ? gameOverText
            : undefined
        }
      />

      {/* Move error (non-blocking) */}
      {moveError ? <p className="-mt-4 text-xs text-red-400">{moveError}</p> : null}

      {/* Board */}
      <GameBoard
        board={board}
        onCellClick={handleCellClick}
        winningLine={winningLine}
        disabled={boardDisabled}
      />

      {/* New / Quit button (placeholders) */}
      <div className="mt-7 flex gap-5">
        <Button variant="primary" disabled>
          New Game (soon)
        </Button>
        <Button variant="danger" onClick={backToLobby}>
          Quit Game
        </Button>
      </div>

      {/* Scoreboard / Player vs Player (unchanged look) */}
      <div className="rounded-lg bg-pong-surface px-12 py-2 shadow-sm">
        <div className="flex items-center gap-8 text-pong-text/80">
          {/* Player 1 */}
          <div className="flex flex-col items-center px-3">
            <span className="font-semibold uppercase tracking-wide text-pong-text/50">
              Player 1
            </span>
            <span className="text-sm">
              You <span className="text-pong-accent">({yourSymbol})</span>
            </span>
            <span className="text-3xl font-sans font-bold text-pong-accent">0</span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center px-7">
            <span className="text-xl font-semibold uppercase tracking-wide text-pong-text/50">
              VS
            </span>
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center">
            <span className="font-semibold uppercase tracking-wide text-pong-text/50">
              Player 2
            </span>
            <span className="text-sm">
              Opponent <span className="text-pong-secondary">(?)</span>
            </span>
            <span className="text-3xl font-sans font-bold text-pong-secondary">0</span>
          </div>
        </div>
      </div>

      <GameOverModal
        open={showGameOverModal && !!gameOverPayload}
        result={gameOverPayload?.result ?? "draw"}
        winner={gameOverPayload?.winner ?? null}
        loser={gameOverPayload?.loser ?? null}
        mySymbol={yourSymbol}
        totalMoves={gameOverPayload?.totalMoves ?? board.filter((cell) => cell !== null).length}
        durationSeconds={gameOverPayload?.duration}
        rematchLoading={isCreatingRematch}
        rematchError={rematchError}
        onPlayAgain={() => {
          void handlePlayAgain();
        }}
        onGoLobby={backToLobby}
        onGoHome={goHome}
        onClose={() => setShowGameOverModal(false)}
      />
    </div>
  );
}
