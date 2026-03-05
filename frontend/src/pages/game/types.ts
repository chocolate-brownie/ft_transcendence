import type { Board, PlayerSymbol, RoomPlayerSummary, GameOverPlayerSummary } from "../../types/game";

export type JoinStatus = "idle" | "connecting" | "joining" | "ready";

export type ServerStatus =
  | "WAITING"
  | "IN_PROGRESS"
  | "FINISHED"
  | "DRAW"
  | "CANCELLED"
  | "ABANDONED";

export type RoomJoined = {
  gameId: number;
  game: {
    boardState: Board;
    currentTurn: PlayerSymbol;
    status: ServerStatus;
    yourSymbol: PlayerSymbol;
    player1: RoomPlayerSummary;
    player2: RoomPlayerSummary | null;
    player1Symbol: PlayerSymbol;
    player2Symbol: PlayerSymbol;
    startedAt: string | null;
  };
};

export type GameUpdate = {
  gameId: number;
  board: Board;
  currentTurn: PlayerSymbol;
  status: ServerStatus;
  winningLine?: number[];
};

export type GameOver = {
  gameId: number;
  finalBoard: Board;
  result: "win" | "draw";
  winner?: GameOverPlayerSummary | null;
  loser?: GameOverPlayerSummary | null;
  totalMoves?: number;
  duration?: number;
  winningLine?: number[] | null;
};

export type MoveError = {
  error: string;
};

export type OpponentJoined = {
  opponent?: {
    id: number;
    username: string;
    avatarUrl?: string | null;
    role?: "player1" | "player2";
    symbol?: PlayerSymbol;
  };
};

export type OpponentDisconnected = {
  gameId?: number;
  username?: string;
  waitTime?: number;
};

export type GameForfeited = {
  gameId: number;
  forfeitedBy?: { id?: number; username?: string; symbol?: PlayerSymbol };
  winner?: { id?: number; username?: string; symbol?: PlayerSymbol };
  winnerSymbol?: PlayerSymbol;
  loserSymbol?: PlayerSymbol;
};
