import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Board } from "../types/game";
import { useSocket } from "../context/SocketContext";

import Card from "../components/Card";
import Button from "../components/Button";
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
  board: Board;
  status: ServerStatus;
  winningLine?: number[];
};

type MoveError = {
  error: string;
  cellIndex: number | null;
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

      if (winningLine) setServerWinningLine(winningLine);

      setIsSendingMove(false);
      setMoveError(null);
    }

    function onGameOver({
      gameId: overId,
      board,
      status,
      winningLine,
    }: GameOver) {
      if (overId !== gameId) return;

      setBoard(board);
      setServerStatus(status);

      if (winningLine) setServerWinningLine(winningLine);

      setIsSendingMove(false);
    }

    function onMoveError({ error }: MoveError) {
      setIsSendingMove(false);
      setMoveError(error);
    }

    function onError({ message }: { message?: string }) {
      setIsSendingMove(false);
      setMoveError(null);
      setError(message || "Something went wrong.");
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
  }, [socket, gameId]);


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

    console.log(`[Game] make_move -> gameId=${gameId}, cellIndex=${index}`);
  }

  function backToLobby() {
    if (socket && gameId) socket.emit("leave_game_room", { gameId });
    void navigate("/lobby");
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

  const backButtonClass =
    "relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md " +
    "transition-colors bg-pong-surface text-pong-text/70 " +
    "hover:bg-pong-accent/10 hover:text-pong-accent focus:outline-none"; // back to lobby to add like every page

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
            ? "Waiting for opponent…"
            : serverStatus === "FINISHED" || serverStatus === "DRAW"
            ? "Game over"
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
    </div>
  );
}