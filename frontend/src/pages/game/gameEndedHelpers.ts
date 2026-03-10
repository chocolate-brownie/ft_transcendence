import type { PlayerSymbol, RoomPlayerSummary } from "../../types/game";
import type { ServerStatus } from "./types";

/** Shape of the game object inside a `game_already_ended` payload. */
export interface EndedGameData {
  status?: ServerStatus;
  boardState?: import("../../types/game").Board;
  yourSymbol?: PlayerSymbol;
  player1?: RoomPlayerSummary;
  player2?: RoomPlayerSummary | null;
  player1Symbol?: PlayerSymbol;
  player2Symbol?: PlayerSymbol;
  winnerId?: number | null;
  gameType?: string;
  tournamentId?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  winningLine?: number[] | null;
}

const DEFAULT_PLAYER: RoomPlayerSummary = {
  id: 0,
  username: "Player 1",
  avatarUrl: null,
};

/** Build the game object expected by the ROOM_JOINED dispatch. */
export function buildRoomJoinedGame(game: EndedGameData, status: ServerStatus) {
  return {
    boardState: game.boardState!,
    currentTurn: game.yourSymbol!,
    status,
    yourSymbol: game.yourSymbol!,
    player1: game.player1 ?? DEFAULT_PLAYER,
    player2: game.player2 ?? null,
    player1Symbol: game.player1Symbol ?? ("X" as PlayerSymbol),
    player2Symbol: game.player2Symbol ?? ("O" as PlayerSymbol),
    gameType: game.gameType,
    tournamentId: game.tournamentId ?? null,
    startedAt: game.startedAt ?? null,
  };
}

/** Resolve winner/loser players and symbols from winnerId. */
export function resolveWinnerLoser(game: EndedGameData) {
  if (game.winnerId == null) {
    return {
      winnerPlayer: undefined,
      loserPlayer: undefined,
      winnerSymbol: undefined,
      loserSymbol: undefined,
    };
  }

  const isP1Winner = game.winnerId === game.player1?.id;
  const isP2Winner = game.winnerId === game.player2?.id;

  if (!isP1Winner && !isP2Winner) {
    return {
      winnerPlayer: undefined,
      loserPlayer: undefined,
      winnerSymbol: undefined,
      loserSymbol: undefined,
    };
  }

  return {
    winnerPlayer: isP1Winner ? game.player1 : game.player2,
    loserPlayer: isP1Winner ? game.player2 : game.player1,
    winnerSymbol: isP1Winner ? game.player1Symbol : game.player2Symbol,
    loserSymbol: isP1Winner ? game.player2Symbol : game.player1Symbol,
  };
}

/** Check if the reconnecting player is the winner. */
export function didPlayerWin(game: EndedGameData): boolean {
  return (
    game.winnerId != null &&
    ((game.player1?.id === game.winnerId && game.yourSymbol === game.player1Symbol) ||
      (game.player2?.id === game.winnerId && game.yourSymbol === game.player2Symbol))
  );
}
