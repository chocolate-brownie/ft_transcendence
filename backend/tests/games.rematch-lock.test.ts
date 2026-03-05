import { describe, expect, it } from "@jest/globals";

import { buildPairLockParts } from "../src/services/games.service";

describe("buildPairLockParts", () => {
  it("returns a stable sorted pair regardless of requester/opponent order", () => {
    expect(buildPairLockParts(10, 2)).toEqual([2, 10]);
    expect(buildPairLockParts(2, 10)).toEqual([2, 10]);
  });

  it("avoids collisions that existed with single-key multiplication strategy", () => {
    const pairA = buildPairLockParts(1, 1_000_001);
    const pairB = buildPairLockParts(2, 1);

    expect(pairA).toEqual([1, 1_000_001]);
    expect(pairB).toEqual([1, 2]);
    expect(pairA).not.toEqual(pairB);
  });
});
