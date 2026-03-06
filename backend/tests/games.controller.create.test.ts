import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockValidateCreateGame = jest.fn<any>();
const mockCreateGameInDb = jest.fn<any>();
const mockCreateOrGetRematchInDb = jest.fn<any>();

jest.unstable_mockModule("./src/services/games.service.js", () => ({
  validateCreateGame: mockValidateCreateGame,
  createGameInDb: mockCreateGameInDb,
  createOrGetRematchInDb: mockCreateOrGetRematchInDb,
  makeMoveInDb: jest.fn(),
  getGameByIdFromDb: jest.fn(),
  getCompletedGamesFromDb: jest.fn(),
  CREATE_ERRORS: {
    SELF_PLAY: "Cannot play against yourself",
    PLAYER_NOT_FOUND: "Player not found",
    NOT_FRIENDS: "Can only play with friends",
    INVALID_REMATCH_SOURCE: "Invalid rematch source game",
    REMATCH_NOT_ALLOWED: "Rematch is only allowed for completed games",
    REMATCH_UNAUTHORIZED: "You are not a participant in the source game",
    REMATCH_OPPONENT_MISMATCH: "Opponent does not match source game",
  },
}));

const { createGame } = await import("../src/controllers/games.controller.js");

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("createGame controller friendship behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires friendship for normal game creation", async () => {
    mockValidateCreateGame.mockResolvedValue({
      valid: false,
      error: "Can only play with friends",
    });

    const req = {
      user: { id: 10 },
      body: { player2Id: 20 },
    };
    const res = makeRes();

    await createGame(req as any, res as any);

    expect(mockValidateCreateGame).toHaveBeenCalledWith(10, 20, true);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Can only play with friends" });
    expect(mockCreateGameInDb).not.toHaveBeenCalled();
    expect(mockCreateOrGetRematchInDb).not.toHaveBeenCalled();
  });

  it("does not require friendship for rematch creation", async () => {
    mockValidateCreateGame.mockResolvedValue({ valid: true });
    mockCreateOrGetRematchInDb.mockResolvedValue({ id: 777 });

    const req = {
      user: { id: 10 },
      body: { player2Id: 20, sourceGameId: 55 },
    };
    const res = makeRes();

    await createGame(req as any, res as any);

    expect(mockValidateCreateGame).toHaveBeenCalledWith(10, 20, false);
    expect(mockCreateOrGetRematchInDb).toHaveBeenCalledWith(10, 20, 55);
    expect(mockCreateGameInDb).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 777 });
  });

  it("passes boardSize to normal game creation", async () => {
    mockValidateCreateGame.mockResolvedValue({ valid: true });
    mockCreateGameInDb.mockResolvedValue({ id: 123, boardSize: 5 });

    const req = {
      user: { id: 10 },
      body: { player2Id: 20, boardSize: 5 },
    };
    const res = makeRes();

    await createGame(req as any, res as any);

    expect(mockValidateCreateGame).toHaveBeenCalledWith(10, 20, true);
    expect(mockCreateGameInDb).toHaveBeenCalledWith(10, 20, 5);
    expect(mockCreateOrGetRematchInDb).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 123, boardSize: 5 });
  });

  it("rejects invalid boardSize", async () => {
    const req = {
      user: { id: 10 },
      body: { player2Id: 20, boardSize: 6 },
    };
    const res = makeRes();

    await createGame(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid board size" });
    expect(mockValidateCreateGame).not.toHaveBeenCalled();
    expect(mockCreateGameInDb).not.toHaveBeenCalled();
    expect(mockCreateOrGetRematchInDb).not.toHaveBeenCalled();
  });
});