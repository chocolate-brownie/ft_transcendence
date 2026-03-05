import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Board } from "../types/game";
import { useSocket } from "../context/SocketContext";
import { ApiError } from "../lib/apiClient";
import { gamesService } from "../services/games.service";

import Button from "../components/Button";
import GameOverModal from "../components/Game/GameOverModal";
import GameBoard from "../components/Game/GameBoard";
import Scoreboard from "../components/Game/Scoreboard";
import TurnIndicator from "../components/Game/TurnIndicator";
import { findWinningLine } from "../utils/gameUtils";

type Symbol = "X" | "O";
type ServerStatus = "WAITING" | "IN_PROGRESS" | "FINISHED" | "DRAW" | "CANCELLED";
type PlayerSummary = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

type RoomJoined = {
  gameId: number;
  game: {
    boardState: Board;
    currentTurn: Symbol;
    status: ServerStatus;
    yourSymbol: Symbol;
    player1: PlayerSummary;
    player2: PlayerSummary | null;
    player1Symbol: Symbol;
    player2Symbol: Symbol;
    startedAt: string | null;
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

  const [status, setStatus] = useState<"idle" | "connecting" | "joining" | "ready">(
    "idle",
  );
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
  const [joinRevision, setJoinRevision] = useState(0);
  const [player1, setPlayer1] = useState<PlayerSummary | null>(null);
  const [player2, setPlayer2] = useState<PlayerSummary | null>(null);
  const [player1Symbol, setPlayer1Symbol] = useState<Symbol>("X");
  const [player2Symbol, setPlayer2Symbol] = useState<Symbol>("O");
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const joinedRef = useRef(false);
  const leftRoomRef = useRef(false);
  const activeRoomIdRef = useRef<number | null>(null);

  // Fix React : Refs pour éviter les closures
  const yourSymbolRef = useRef(yourSymbol);
  yourSymbolRef.current = yourSymbol;

  const statusRef = useRef(status);
  statusRef.current = status;

  const emitLeaveRoomOnce = useCallback(() => {
    if (!socket) return;
    if (leftRoomRef.current) return;

    const roomId = activeRoomIdRef.current ?? gameId;
    if (!roomId) return;

    console.log(`[Game] Leaving room ${roomId}`);
    leftRoomRef.current = true;
    socket.emit("leave_game_room", { gameId: roomId });
  }, [socket, gameId]);

  // Le GRAND useEffect des sockets
  useEffect(() => {
    if (!socket) return;

    function onRoomJoined({ gameId: joinedId, game }: RoomJoined) {
      if (joinedId !== gameId) return;
      console.log(`[Game] Joined room ${joinedId}. Status: ${game.status}`);
      activeRoomIdRef.current = joinedId;

      setBoard(game.boardState);
      setCurrentTurn(game.currentTurn);
      setServerStatus(game.status);
      setYourSymbol(game.yourSymbol);
      setPlayer1(game.player1);
      setPlayer2(game.player2);
      setPlayer1Symbol(game.player1Symbol);
      setPlayer2Symbol(game.player2Symbol);
      setStartedAtMs(game.startedAt ? new Date(game.startedAt).getTime() : null);

      setServerWinningLine(null);
      setIsSendingMove(false);
      setMoveError(null);
      setGameResultText(null);
      setGameOverPayload(null);
      setShowGameOverModal(false);
      setIsCreatingRematch(false);
      setRematchError(null);
      setError(null);
      
      if (game.status === "DRAW") {
        setGameResultText("Draw game");
      }
      if (game.status === "FINISHED") {
        const line = findWinningLine(game.boardState);
        const winnerSymbol = line ? game.boardState[line[0]] : null;
        if (winnerSymbol === game.yourSymbol) setGameResultText("You won");
        else if (winnerSymbol === "X" || winnerSymbol === "O")
          setGameResultText("You lost");
      }
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
          : winner?.symbol === yourSymbolRef.current
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

    function onError({
      gameId: eventGameId,
      message,
    }: {
      gameId?: number;
      message?: string;
    }) {
      if (typeof eventGameId === "number" && eventGameId !== gameId) return;

      const userMessage = message || "Something went wrong.";
      setIsSendingMove(false);

      if (statusRef.current === "ready") {
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

    // FIX RESEAU : Réception de la demande de revanche de l'adversaire
    function onRematchReceived({ newGameId }: { newGameId: number }) {
      console.log(`[Game] Rematch received for game ${newGameId}. Navigating...`);
      setIsCreatingRematch(true);
      setRematchError(null);
      // On ne touche PAS aux refs ici, le composant va mourir et être remplacé
      // On navigue simplement, le cleanup (emitLeaveRoomOnce) se fera tout seul
      void navigate(`/game/${newGameId}`);
    }

    socket.on("room_joined", onRoomJoined);
    socket.on("game_update", onGameUpdate);
    socket.on("game_over", onGameOver);
    socket.on("move_error", onMoveError);
    socket.on("error", onError);
    socket.on("disconnect", onDisconnect);
    socket.on("rematch_received", onRematchReceived);

    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("game_update", onGameUpdate);
      socket.off("game_over", onGameOver);
      socket.off("move_error", onMoveError);
      socket.off("error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("rematch_received", onRematchReceived);
    };
  }, [socket, gameId]);

  useEffect(() => {
    if (!socket || !gameId) return;

    const previousRoomId = activeRoomIdRef.current;
    if (previousRoomId && previousRoomId !== gameId) {
      socket.emit("leave_game_room", { gameId: previousRoomId });
    }

    // Route param changes can reuse the same component instance. Reset join guards
    // so rematch navigation always performs a fresh join for the new game room.
    joinedRef.current = false;
    leftRoomRef.current = false;
    activeRoomIdRef.current = null;
    setStatus("idle");
  }, [socket, gameId]);

  // FIX TIMER : Arrêt correct quand fin de partie
  useEffect(() => {
    if (startedAtMs === null || serverStatus !== "IN_PROGRESS") {
      return;
    }

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAtMs, serverStatus]);

  useEffect(() => {
    function startJoin() {
      if (!socket || joinedRef.current) return;
      
      console.log(`[Game] Joining room ${gameId}...`);
      joinedRef.current = true;
      
      // CRITICAL FIX : On doit reset leftRoomRef ici pour autoriser le join !
      leftRoomRef.current = false; 

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
  }, [socket, gameId, joinRevision]);

  // Cleanup au démontage : quitte proprement la room
  useEffect(() => {
    return () => {
      emitLeaveRoomOnce();
    };
  }, [emitLeaveRoomOnce]);

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
    emitLeaveRoomOnce();
    void navigate("/lobby");
  }

  function goHome() {
    emitLeaveRoomOnce();
    void navigate("/");
  }

  // FIX RESEAU : Rematch simplifié
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
      const newGame = await gamesService.createGame({ player2Id: opponentId, sourceGameId: gameId });

      // 1. On prévient l'adversaire (on est encore dans la room, donc il recevra)
      socket?.emit("send_rematch", { gameId, newGameId: newGame.id });

      // 2. On navigue -> React démonte l'ancien Game -> Le cleanup (emitLeaveRoomOnce) quitte la room.
      void navigate(`/game/${newGame.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to create rematch. Please retry.";
      setRematchError(message);
      setIsCreatingRematch(false);
    }
  }

  function handleRetry() {
    if (!navigator.onLine) {
      setError("You are offline. Reconnect to the internet and try again.");
      return;
    }
    if (!socket) {
      setStatus("connecting");
      setError("Still connecting to server. Please try again in a moment.");
      return;
    }

    joinedRef.current = false;
    setError(null);
    setMoveError(null);
    setIsSendingMove(false);
    setJoinRevision((n) => n + 1);

    if (!socket.connected) {
      setStatus("connecting");
      socket.connect();
    } else {
      setStatus("idle");
    }
  }

  const opponentAvatarUrl = (() => {
    if (!gameOverPayload) return null;
    const opponentId =
      gameOverPayload.winner?.symbol === yourSymbol
        ? gameOverPayload.loser?.id
        : gameOverPayload.winner?.id;
    if (!opponentId) return null;
    if (player1?.id === opponentId) return player1.avatarUrl;
    if (player2?.id === opponentId) return player2.avatarUrl;
    return null;
  })();

  const isYourTurn =
    status === "ready" && serverStatus === "IN_PROGRESS" && currentTurn === yourSymbol;
  const boardDisabled = !isYourTurn || isSendingMove;
  const winningLine = serverWinningLine || findWinningLine(board);
  const moveCount = board.filter((cell) => cell !== null).length;
  const gameClock = gameOverPayload?.duration ?? elapsedSeconds;
  const isGameOver = serverStatus === "FINISHED" || serverStatus === "DRAW";
  const winnerSymbol =
    gameOverPayload?.winner?.symbol ??
    (isGameOver && winningLine ? board[winningLine[0]] : null);
  const waitingText =
    gameId > 0 ? `Waiting for opponent in game #${gameId}…` : "Waiting for opponent…";
  const gameOverText = gameResultText ? `Game over: ${gameResultText}` : "Game over";
  const player1Score = gameOverPayload?.winner?.symbol === player1Symbol ? 1 : 0;
  const player2Score = gameOverPayload?.winner?.symbol === player2Symbol ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold text-pong-text -mb-4">
        {gameId > 0 ? `Game #${gameId}` : "Game"}
      </h1>

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
        <p className="animate-pulse text-sm text-pong-text/60">Connecting…</p>
      ) : status === "joining" ? (
        <p className="animate-pulse text-sm text-pong-text/60">Joining game…</p>
      ) : status !== "ready" ? (
        <p className="animate-pulse text-sm text-pong-text/60">Loading game…</p>
      ) : null}

      {serverStatus === "WAITING" ? (
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

      <Scoreboard
        player1={player1}
        player2={player2}
        player1Symbol={player1Symbol}
        player2Symbol={player2Symbol}
        currentTurn={currentTurn}
        serverStatus={serverStatus}
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
            serverStatus === "DRAW"
              ? "border-slate-300/40 bg-slate-300/10 text-pong-text/90"
              : gameResultText === "You won"
                ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-300"
                : "border-red-300/50 bg-red-400/10 text-red-300"
          }`}
        >
          <p className="text-2xl font-bold">
            {serverStatus === "DRAW"
              ? "It's a Draw! 🤝"
              : gameResultText === "You won"
                ? "You Won! 🎉"
                : "You Lost 😢"}
          </p>
        </div>
      ) : null}

      {moveError ? <p className="-mt-4 text-xs text-red-400">{moveError}</p> : null}

      <GameBoard
        board={board}
        onCellClick={handleCellClick}
        winningLine={winningLine}
        winnerSymbol={winnerSymbol === "X" || winnerSymbol === "O" ? winnerSymbol : null}
        playerSymbol={yourSymbol}
        gameOver={isGameOver}
        disabled={boardDisabled}
      />

      <GameOverModal
        open={showGameOverModal && !!gameOverPayload}
        result={gameOverPayload?.result ?? "draw"}
        winner={gameOverPayload?.winner ?? null}
        loser={gameOverPayload?.loser ?? null}
        mySymbol={yourSymbol}
        totalMoves={
          gameOverPayload?.totalMoves ?? board.filter((cell) => cell !== null).length
        }
        durationSeconds={gameOverPayload?.duration}
        opponentAvatarUrl={opponentAvatarUrl}
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
