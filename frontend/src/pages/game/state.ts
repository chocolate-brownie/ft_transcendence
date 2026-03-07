import { findWinningLine } from "../../utils/gameUtils";
import type { Board, PlayerSymbol, RoomPlayerSummary } from "../../types/game";
import type { GameOver, GameUpdate, JoinStatus, RoomJoined, ServerStatus } from "./types";

export type GameViewState = {
  status: JoinStatus;
  error: string | null;
  board: Board;
  currentTurn: PlayerSymbol;
  serverStatus: ServerStatus;
  yourSymbol: PlayerSymbol;
  serverWinningLine: number[] | null;
  isSendingMove: boolean;
  moveError: string | null;
  gameResultText: string | null;
  gameOverPayload: GameOver | null;
  showGameOverModal: boolean;
  isCreatingRematch: boolean;
  rematchError: string | null;
  player1: RoomPlayerSummary | null;
  player2: RoomPlayerSummary | null;
  player1Symbol: PlayerSymbol;
  player2Symbol: PlayerSymbol;
  startedAtMs: number | null;
  opponentConnection: "online" | "disconnected";
  disconnectCountdown: number | null;
  disconnectedOpponentName: string | null;
};

export type GameAction =
  | { type: "ROOM_JOINED"; game: RoomJoined["game"] }
  | { type: "GAME_UPDATE"; payload: GameUpdate }
  | { type: "GAME_OVER"; payload: GameOver; didWin: boolean }
  | {
      type: "OPPONENT_JOINED";
      opponent: RoomPlayerSummary;
      role?: "player1" | "player2";
      fallbackToPlayer2: boolean;
    }
  | { type: "OPPONENT_DISCONNECTED"; username: string; waitTime: number }
  | { type: "OPPONENT_RECONNECTED" }
  | { type: "GAME_FORFEITED"; payload: GameOver; didWin: boolean }
  | { type: "MOVE_ERROR"; error: string }
  | { type: "SOCKET_ERROR"; message: string; asMoveError: boolean }
  | { type: "SOCKET_DISCONNECT"; message: string }
  | { type: "JOIN_CONNECTING" }
  | { type: "JOIN_START" }
  | { type: "INVALID_GAME_ID"; message: string }
  | { type: "BEGIN_MOVE_SEND" }
  | { type: "DISCONNECT_COUNTDOWN_TICK" }
  | { type: "REMATCH_RECEIVED" }
  | { type: "REMATCH_REQUEST_START" }
  | { type: "REMATCH_REQUEST_FAILED"; message: string }
  | { type: "REMATCH_OPPONENT_MISSING" }
  | { type: "RETRY_OFFLINE" }
  | { type: "RETRY_SOCKET_UNAVAILABLE" }
  | { type: "RETRY_RESET" }
  | { type: "RETRY_READY" }
  | { type: "OPEN_GAME_OVER_MODAL" }
  | { type: "CLOSE_GAME_OVER_MODAL" }
  | { type: "RESET_FOR_ROUTE_CHANGE" };

export const initialGameState: GameViewState = {
  status: "idle",
  error: null,
  board: Array(9).fill(null),
  currentTurn: "X",
  serverStatus: "WAITING",
  yourSymbol: "X",
  serverWinningLine: null,
  isSendingMove: false,
  moveError: null,
  gameResultText: null,
  gameOverPayload: null,
  showGameOverModal: false,
  isCreatingRematch: false,
  rematchError: null,
  player1: null,
  player2: null,
  player1Symbol: "X",
  player2Symbol: "O",
  startedAtMs: null,
  opponentConnection: "online",
  disconnectCountdown: null,
  disconnectedOpponentName: null,
};

export function gameReducer(state: GameViewState, action: GameAction): GameViewState {
  switch (action.type) {
    case "ROOM_JOINED": {
      const { game } = action;
      let gameResultText: string | null = null;

      if (game.status === "DRAW") {
        gameResultText = "Draw game";
      } else if (game.status === "FINISHED") {
        const line = findWinningLine(game.boardState);
        const winnerSymbol = line ? game.boardState[line[0]] : null;
        if (winnerSymbol === game.yourSymbol) gameResultText = "You won";
        else if (winnerSymbol === "X" || winnerSymbol === "O")
          gameResultText = "You lost";
      }

      return {
        ...state,
        status: "ready",
        error: null,
        board: game.boardState,
        currentTurn: game.currentTurn,
        serverStatus: game.status,
        yourSymbol: game.yourSymbol,
        serverWinningLine: null,
        isSendingMove: false,
        moveError: null,
        gameResultText,
        gameOverPayload: null,
        showGameOverModal: false,
        isCreatingRematch: false,
        rematchError: null,
        player1: game.player1,
        player2: game.player2,
        player1Symbol: game.player1Symbol,
        player2Symbol: game.player2Symbol,
        startedAtMs: game.startedAt ? new Date(game.startedAt).getTime() : null,
        opponentConnection: "online",
        disconnectCountdown: null,
        disconnectedOpponentName: null,
      };
    }
    case "GAME_UPDATE":
      return {
        ...state,
        board: action.payload.board,
        currentTurn: action.payload.currentTurn,
        serverStatus: action.payload.status,
        serverWinningLine: action.payload.winningLine ?? null,
        isSendingMove: false,
        moveError: null,
      };
    case "GAME_OVER":
      return {
        ...state,
        board: action.payload.finalBoard,
        serverStatus: action.payload.result === "draw" ? "DRAW" : "FINISHED",
        gameResultText:
          action.payload.result === "draw"
            ? "Draw game"
            : action.didWin
              ? "You won"
              : "You lost",
        serverWinningLine: action.payload.winningLine ?? null,
        gameOverPayload: action.payload,
        showGameOverModal: true,
        rematchError: null,
        opponentConnection: "online",
        disconnectCountdown: null,
        disconnectedOpponentName: null,
        isSendingMove: false,
        moveError: null,
      };
    case "OPPONENT_JOINED": {
      const { opponent, role, fallbackToPlayer2 } = action;
      const knownPlayer1 = state.player1;
      const knownPlayer2 = state.player2;

      if (knownPlayer1?.id === opponent.id) {
        return {
          ...state,
          player1: {
            ...knownPlayer1,
            ...opponent,
            avatarUrl: opponent.avatarUrl ?? knownPlayer1.avatarUrl,
          },
          opponentConnection: "online",
          disconnectCountdown: null,
          disconnectedOpponentName: null,
        };
      }

      if (knownPlayer2?.id === opponent.id) {
        return {
          ...state,
          player2: {
            ...knownPlayer2,
            ...opponent,
            avatarUrl: opponent.avatarUrl ?? knownPlayer2.avatarUrl,
          },
          opponentConnection: "online",
          disconnectCountdown: null,
          disconnectedOpponentName: null,
        };
      }

      if (role === "player1" || (!role && !fallbackToPlayer2)) {
        return {
          ...state,
          player1: opponent,
          opponentConnection: "online",
          disconnectCountdown: null,
          disconnectedOpponentName: null,
        };
      }

      return {
        ...state,
        player2: opponent,
        opponentConnection: "online",
        disconnectCountdown: null,
        disconnectedOpponentName: null,
      };
    }
    case "OPPONENT_DISCONNECTED":
      return {
        ...state,
        opponentConnection: "disconnected",
        disconnectedOpponentName: action.username,
        disconnectCountdown: action.waitTime,
      };
    case "OPPONENT_RECONNECTED":
      return {
        ...state,
        opponentConnection: "online",
        disconnectCountdown: null,
        disconnectedOpponentName: null,
      };
    case "GAME_FORFEITED":
      return {
        ...state,
        board: action.payload.finalBoard,
        serverStatus: "FINISHED",
        gameResultText: action.didWin ? "You won" : "You lost",
        gameOverPayload: action.payload,
        showGameOverModal: true,
        opponentConnection: "online",
        disconnectCountdown: null,
        disconnectedOpponentName: null,
        isSendingMove: false,
        moveError: null,
      };
    case "MOVE_ERROR":
      return { ...state, isSendingMove: false, moveError: action.error };
    case "SOCKET_ERROR":
      if (action.asMoveError) {
        return { ...state, isSendingMove: false, moveError: action.message };
      }
      return {
        ...state,
        status: "idle",
        isSendingMove: false,
        moveError: null,
        error: action.message,
      };
    case "SOCKET_DISCONNECT":
      return {
        ...state,
        status: "idle",
        isSendingMove: false,
        moveError: null,
        error: action.message,
      };
    case "JOIN_CONNECTING":
      return { ...state, status: "connecting" };
    case "JOIN_START":
      return {
        ...state,
        status: "joining",
        error: null,
        moveError: null,
        isSendingMove: false,
      };
    case "INVALID_GAME_ID":
      return { ...state, status: "idle", error: action.message };
    case "BEGIN_MOVE_SEND":
      return { ...state, isSendingMove: true, moveError: null };
    case "DISCONNECT_COUNTDOWN_TICK":
      return {
        ...state,
        disconnectCountdown:
          state.disconnectCountdown && state.disconnectCountdown > 0
            ? state.disconnectCountdown - 1
            : 0,
      };
    case "REMATCH_RECEIVED":
      return { ...state, isCreatingRematch: true, rematchError: null };
    case "REMATCH_REQUEST_START":
      return { ...state, isCreatingRematch: true, rematchError: null };
    case "REMATCH_REQUEST_FAILED":
      return { ...state, rematchError: action.message, isCreatingRematch: false };
    case "REMATCH_OPPONENT_MISSING":
      return {
        ...state,
        rematchError: "Unable to identify opponent for rematch.",
        isCreatingRematch: false,
      };
    case "RETRY_OFFLINE":
      return {
        ...state,
        error: "You are offline. Reconnect to the internet and try again.",
      };
    case "RETRY_SOCKET_UNAVAILABLE":
      return {
        ...state,
        status: "connecting",
        error: "Still connecting to server. Please try again in a moment.",
      };
    case "RETRY_RESET":
      return {
        ...state,
        error: null,
        moveError: null,
        isSendingMove: false,
      };
    case "RETRY_READY":
      return { ...state, status: "idle" };
    case "OPEN_GAME_OVER_MODAL":
      return { ...state, showGameOverModal: true };
    case "CLOSE_GAME_OVER_MODAL":
      return { ...state, showGameOverModal: false };
    case "RESET_FOR_ROUTE_CHANGE":
      return { ...state, status: "idle" };
    default:
      return state;
  }
}
