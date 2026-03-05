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

export function useGameSocketController({
  socket,
  gameId,
  joinRevision,
  navigate,
  dispatch,
  stateRef,
}: UseGameSocketControllerParams) {
  const joinedRef = useRef(false);
  const leftRoomRef = useRef(false);
  const activeRoomIdRef = useRef<number | null>(null);

  const emitLeaveRoomOnce = useCallback(() => {
    if (!socket) return;
    if (leftRoomRef.current) return;

    const roomId = activeRoomIdRef.current ?? gameId;
    if (!roomId) return;

    leftRoomRef.current = true;
    socket.emit("leave_game_room", { gameId: roomId });
  }, [socket, gameId]);

  useEffect(() => {
    if (!socket) return;

    function onRoomJoined({ gameId: joinedId, game }: RoomJoined) {
      if (joinedId !== gameId) return;
      activeRoomIdRef.current = joinedId;
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

    function onError({ gameId: eventGameId, message }: { gameId?: number; message?: string }) {
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
      dispatch({ type: "PATCH", patch: { isCreatingRematch: true, rematchError: null } });
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
  }, [socket, gameId, navigate, dispatch, stateRef]);

  useEffect(() => {
    if (!socket) return;

    function onOpponentJoined({ opponent }: OpponentJoined) {
      if (!opponent) return;
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

  useEffect(() => {
    if (!socket || !gameId) return;

    const previousRoomId = activeRoomIdRef.current;
    if (previousRoomId && previousRoomId !== gameId) {
      socket.emit("leave_game_room", { gameId: previousRoomId });
    }

    joinedRef.current = false;
    leftRoomRef.current = false;
    activeRoomIdRef.current = null;
    dispatch({ type: "RESET_FOR_ROUTE_CHANGE" });
  }, [socket, gameId, dispatch]);

  useEffect(() => {
    function startJoin() {
      if (!socket || joinedRef.current) return;

      joinedRef.current = true;
      leftRoomRef.current = false;

      dispatch({ type: "JOIN_START" });
      socket.emit("join_game_room", { gameId });
    }

    if (joinedRef.current) return;

    if (!gameId) {
      dispatch({ type: "INVALID_GAME_ID", message: "Invalid game id in URL." });
      return;
    }

    if (!socket) {
      dispatch({ type: "JOIN_CONNECTING" });
      return;
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
  }, [socket, gameId, joinRevision, dispatch]);

  return { emitLeaveRoomOnce, resetJoinGuard: () => { joinedRef.current = false; } };
}
