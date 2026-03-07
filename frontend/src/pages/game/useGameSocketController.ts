import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { NavigateFunction } from "react-router-dom";

import type { RoomPlayerSummary } from "../../types/game";
import type {
  GameForfeited,
  GameOver,
  GameUpdate,
  MoveError,
  OpponentDisconnected,
  OpponentJoined,
  RoomJoined,
} from "./types";
import type { GameAction, GameViewState } from "./state";

type UseGameSocketControllerParams = {
  socket: Socket | null;
  gameId: number;
  joinRevision: number;
  navigate: NavigateFunction;
  dispatch: React.Dispatch<GameAction>;
  stateRef: React.MutableRefObject<GameViewState>;
};

const LEAVE_DEBOUNCE_MS = 150;

/* Module-level state — intentionally lives outside the hook.

WHY: React StrictMode double-invokes effects in development. If this state
lived inside the hook (e.g. a useRef), each mount/unmount cycle would reset
it, causing a second join_game_room emit before the first completes. By
keeping it at module scope it survives the StrictMode unmount and prevents
duplicate join/leave events.

RISK: stale gameId across navigations. Mitigated by the joinRevision and
gameId change effects which both reset pendingGameId/joinedGameId explicitly.
Revisit with a proper context or ref-forwarding approach in Phase 5. */
const joinState = {
  pendingGameId: null as number | null,
  joinedGameId: null as number | null,
  leaveTimeout: null as ReturnType<typeof setTimeout> | null,
};

/** Reset module-level join state — only for use in tests. */
export function __resetJoinStateForTests() {
  joinState.pendingGameId = null;
  joinState.joinedGameId = null;
  if (joinState.leaveTimeout) {
    clearTimeout(joinState.leaveTimeout);
    joinState.leaveTimeout = null;
  }
}

export function useGameSocketController({
  socket,
  gameId,
  joinRevision,
  navigate,
  dispatch,
  stateRef,
}: UseGameSocketControllerParams) {
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const activeRoomIdRef = useRef<number | null>(null);
  const lastJoinRevisionRef = useRef(joinRevision);
  const receivedEventsRef = useRef({
    roomJoined: false,
    opponentJoined: false,
  });

  // ── Cancel pending leave ──
  const cancelPendingLeave = useCallback(() => {
    if (joinState.leaveTimeout) {
      clearTimeout(joinState.leaveTimeout);
      joinState.leaveTimeout = null;
    }
  }, []);

  // ── Leave with debounce ──
  const emitLeaveRoomOnce = useCallback(() => {
    if (!socket) return;

    const roomId = activeRoomIdRef.current ?? gameId;
    if (!roomId) return;

    cancelPendingLeave();

    joinState.leaveTimeout = setTimeout(() => {
      // Vérifier qu'on n'a pas rejoint entre temps
      if (joinState.joinedGameId === roomId && joinState.pendingGameId === roomId) {
        // On veut toujours cette room, ne pas leave
        return;
      }

      socket.emit("leave_game_room", { gameId: roomId });

      if (joinState.joinedGameId === roomId) {
        joinState.joinedGameId = null;
      }
      joinState.leaveTimeout = null;
    }, LEAVE_DEBOUNCE_MS);
  }, [socket, gameId, cancelPendingLeave]);

  // ── Event listeners ──
  useEffect(() => {
    if (!socket) return;

    function onRoomJoined({ gameId: joinedId, game }: RoomJoined) {
      if (joinedId !== gameId) return;

      // Ignorer les doublons
      if (receivedEventsRef.current.roomJoined) {
        if (import.meta.env.DEV)
          console.log("[Game] Ignoring duplicate room_joined for game", joinedId);
        return;
      }

      receivedEventsRef.current.roomJoined = true;
      activeRoomIdRef.current = joinedId;
      joinState.joinedGameId = joinedId;
      dispatch({ type: "ROOM_JOINED", game });
    }

    function onGameUpdate(payload: GameUpdate) {
      if (payload.gameId !== gameId) return;
      dispatch({ type: "GAME_UPDATE", payload });
    }

    function onGameOver(payload: GameOver) {
      if (payload.gameId !== gameId) return;
      const didWin = payload.winner?.symbol === stateRef.current.yourSymbol;
      dispatch({ type: "GAME_OVER", payload, didWin });
    }

    function onMoveError({ error }: MoveError) {
      dispatch({ type: "MOVE_ERROR", error });
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
      const asMoveError = stateRef.current.status === "ready";
      dispatch({ type: "SOCKET_ERROR", message: userMessage, asMoveError });
    }

    function onDisconnect() {
      dispatch({
        type: "SOCKET_DISCONNECT",
        message: "Connection lost. Please check your network and try again.",
      });
    }

    function onRematchReceived({ newGameId }: { newGameId: number }) {
      dispatch({ type: "REMATCH_RECEIVED" });
      void navigate(`/game/${newGameId}`);
    }

    function onGameAlreadyEnded(data?: {
      gameId?: number;
      game?: {
        status?: string;
        boardState?: import("../../types/game").Board;
        yourSymbol?: import("../../types/game").PlayerSymbol;
        player1?: import("../../types/game").RoomPlayerSummary;
        player2?: import("../../types/game").RoomPlayerSummary | null;
        player1Symbol?: import("../../types/game").PlayerSymbol;
        player2Symbol?: import("../../types/game").PlayerSymbol;
        winnerId?: number | null;
        startedAt?: string | null;
      };
    }) {
      const game = data?.game;
      if (game?.status === "ABANDONED" && game.boardState && game.yourSymbol) {
        // Show the forfeit result instead of redirecting
        dispatch({
          type: "ROOM_JOINED",
          game: {
            boardState: game.boardState,
            currentTurn: game.yourSymbol,
            status: "ABANDONED" as const,
            yourSymbol: game.yourSymbol,
            player1: game.player1 ?? { id: 0, username: "Player 1", avatarUrl: null },
            player2: game.player2 ?? null,
            player1Symbol: game.player1Symbol ?? "X",
            player2Symbol: game.player2Symbol ?? "O",
            startedAt: game.startedAt ?? null,
          },
        });
        // Determine if this player won
        const didWin =
          game.winnerId != null &&
          ((game.player1?.id === game.winnerId &&
            game.yourSymbol === game.player1Symbol) ||
            (game.player2?.id === game.winnerId &&
              game.yourSymbol === game.player2Symbol));
        const winnerPlayer =
          game.winnerId === game.player1?.id ? game.player1 : game.player2;
        const loserPlayer =
          game.winnerId === game.player1?.id ? game.player2 : game.player1;
        const winnerSymbol =
          game.winnerId === game.player1?.id ? game.player1Symbol : game.player2Symbol;
        const loserSymbol =
          game.winnerId === game.player1?.id ? game.player2Symbol : game.player1Symbol;
        dispatch({
          type: "GAME_FORFEITED",
          payload: {
            gameId: data?.gameId ?? gameId,
            finalBoard: game.boardState,
            result: "win",
            winner: winnerPlayer
              ? {
                  id: winnerPlayer.id,
                  username: winnerPlayer.username,
                  symbol: winnerSymbol ?? "X",
                }
              : undefined,
            loser: loserPlayer
              ? {
                  id: loserPlayer.id,
                  username: loserPlayer.username,
                  symbol: loserSymbol ?? "O",
                }
              : undefined,
          },
          didWin,
        });
        return;
      }
      if (import.meta.env.DEV)
        console.log("[Game] Game already ended, redirecting to lobby");
      void navigate("/lobby");
    }

    socket.on("room_joined", onRoomJoined);
    socket.on("game_update", onGameUpdate);
    socket.on("game_over", onGameOver);
    socket.on("move_error", onMoveError);
    socket.on("error", onError);
    socket.on("disconnect", onDisconnect);
    socket.on("rematch_received", onRematchReceived);
    socket.on("game_already_ended", onGameAlreadyEnded);

    return () => {
      socket.off("room_joined", onRoomJoined);
      socket.off("game_update", onGameUpdate);
      socket.off("game_over", onGameOver);
      socket.off("move_error", onMoveError);
      socket.off("error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("rematch_received", onRematchReceived);
      socket.off("game_already_ended", onGameAlreadyEnded);
    };
  }, [socket, gameId, navigate, dispatch, stateRef]);

  // ── Opponent events ──
  useEffect(() => {
    if (!socket) return;

    function onOpponentJoined({ opponent }: OpponentJoined) {
      if (!opponent) return;

      // Ignorer les doublons
      if (receivedEventsRef.current.opponentJoined) {
        if (import.meta.env.DEV) console.log("[Game] Ignoring duplicate opponent_joined");
        return;
      }

      receivedEventsRef.current.opponentJoined = true;

      const normalizedOpponent: RoomPlayerSummary = {
        id: opponent.id,
        username: opponent.username,
        avatarUrl: opponent.avatarUrl ?? null,
      };
      dispatch({
        type: "OPPONENT_JOINED",
        opponent: normalizedOpponent,
        role: opponent.role,
        fallbackToPlayer2: stateRef.current.yourSymbol === "X",
      });
    }

    function onOpponentDisconnected({
      gameId: disconnectedGameId,
      username,
      waitTime,
    }: OpponentDisconnected) {
      if (typeof disconnectedGameId === "number" && disconnectedGameId !== gameId) return;
      const safeWait = typeof waitTime === "number" && waitTime > 0 ? waitTime : 30;
      dispatch({
        type: "OPPONENT_DISCONNECTED",
        username: username ?? "Opponent",
        waitTime: safeWait,
      });
    }

    function onOpponentReconnected({ gameId: reconnectedGameId }: { gameId?: number }) {
      if (typeof reconnectedGameId === "number" && reconnectedGameId !== gameId) return;
      dispatch({ type: "OPPONENT_RECONNECTED" });
    }

    function onGameForfeited({
      gameId: forfeitedGameId,
      winner,
      forfeitedBy,
      winnerSymbol,
      loserSymbol,
    }: GameForfeited) {
      if (forfeitedGameId !== gameId) return;

      const state = stateRef.current;
      const resolvedWinnerId = winner?.id;
      const resolvedLoserId = forfeitedBy?.id;

      const resolvedWinnerSymbol =
        winnerSymbol ??
        winner?.symbol ??
        (resolvedWinnerId === state.player1?.id
          ? state.player1Symbol
          : resolvedWinnerId === state.player2?.id
            ? state.player2Symbol
            : null);
      const resolvedLoserSymbol =
        loserSymbol ??
        forfeitedBy?.symbol ??
        (resolvedLoserId === state.player1?.id
          ? state.player1Symbol
          : resolvedLoserId === state.player2?.id
            ? state.player2Symbol
            : null);

      const payload: GameOver = {
        gameId: forfeitedGameId,
        finalBoard: state.board,
        result: "win",
        winner:
          typeof resolvedWinnerId === "number" && resolvedWinnerSymbol
            ? {
                id: resolvedWinnerId,
                username: winner?.username ?? "Opponent",
                symbol: resolvedWinnerSymbol,
              }
            : undefined,
        loser:
          typeof resolvedLoserId === "number" && resolvedLoserSymbol
            ? {
                id: resolvedLoserId,
                username: forfeitedBy?.username ?? "Opponent",
                symbol: resolvedLoserSymbol,
              }
            : undefined,
      };

      dispatch({
        type: "GAME_FORFEITED",
        payload,
        didWin: resolvedWinnerSymbol === state.yourSymbol,
      });
    }

    socket.on("opponent_joined", onOpponentJoined);
    socket.on("opponent_disconnected", onOpponentDisconnected);
    socket.on("opponent_reconnected", onOpponentReconnected);
    socket.on("game_forfeited", onGameForfeited);

    return () => {
      socket.off("opponent_joined", onOpponentJoined);
      socket.off("opponent_disconnected", onOpponentDisconnected);
      socket.off("opponent_reconnected", onOpponentReconnected);
      socket.off("game_forfeited", onGameForfeited);
    };
  }, [socket, gameId, dispatch, stateRef]);

  // ── Reset on joinRevision change ──
  useEffect(() => {
    if (joinRevision === lastJoinRevisionRef.current) return;
    lastJoinRevisionRef.current = joinRevision;
    receivedEventsRef.current = { roomJoined: false, opponentJoined: false };
    joinState.joinedGameId = null;
    joinState.pendingGameId = null;
  }, [joinRevision]);

  // ── Reset on gameId change ──
  useEffect(() => {
    if (!socket || !gameId) return;

    const previousRoomId = activeRoomIdRef.current;
    if (previousRoomId && previousRoomId !== gameId) {
      cancelPendingLeave();
      socket.emit("leave_game_room", { gameId: previousRoomId });
      joinState.joinedGameId = null;
    }

    activeRoomIdRef.current = null;
    receivedEventsRef.current = { roomJoined: false, opponentJoined: false };
    dispatch({ type: "RESET_FOR_ROUTE_CHANGE" });
  }, [socket, gameId, dispatch, cancelPendingLeave]);

  // ══════════════════════════════════════════════════════════════════════
  // JOIN LOGIC — avec déduplication via état module
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!gameId) {
      dispatch({ type: "INVALID_GAME_ID", message: "Invalid game id in URL." });
      return;
    }

    if (!socket) {
      dispatch({ type: "JOIN_CONNECTING" });
      return;
    }

    function startJoin() {
      if (!socket) return;

      // Annuler tout leave en attente
      cancelPendingLeave();

      // ══ DÉDUPLICATION CLÉ ══
      // Si on a déjà un join pending ou complété pour ce gameId, skip
      if (joinState.pendingGameId === gameId || joinState.joinedGameId === gameId) {
        if (import.meta.env.DEV)
          console.log(
            "[Game] Join already pending/completed for game",
            gameId,
            "— skipping",
          );
        return;
      }

      joinState.pendingGameId = gameId;
      dispatch({ type: "JOIN_START" });
      socket.emit("join_game_room", { gameId });
    }

    if (!socket.connected) {
      dispatch({ type: "JOIN_CONNECTING" });
      socket.once("connect", startJoin);
      socket.connect();
      return () => {
        socket.off("connect", startJoin);
      };
    }

    startJoin();
  }, [socket, gameId, joinRevision, dispatch, cancelPendingLeave]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      // On unmount, emit leave_game_room synchronously — bypass the debounce
      // because the component is being destroyed and a debounced call may
      // never fire.
      if (joinState.leaveTimeout) {
        clearTimeout(joinState.leaveTimeout);
        joinState.leaveTimeout = null;
      }
      const roomId = joinState.joinedGameId;
      if (roomId && socketRef.current) {
        socketRef.current.emit("leave_game_room", { gameId: roomId });
      }
      // Reset both so a remount for the same gameId triggers a fresh join.
      joinState.joinedGameId = null;
      joinState.pendingGameId = null;
    };
  }, []);

  return { emitLeaveRoomOnce };
}
