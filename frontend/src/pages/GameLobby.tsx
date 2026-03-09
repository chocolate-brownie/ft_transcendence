/**
 * GameLobby — Issue #183
 *
 * Landing page for mode selection. Offers Play Local, Play Online, and Play vs AI.
 * Board size selection applies to local and online modes. The AI mode always uses
 * a 3x3 board (backend constraint) and difficulty is now chosen on the AI game
 * page itself, so no difficulty dropdown is shown here.
 */
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import type { BoardSize } from "../types/game";
import GameModeCard from "../components/Lobby/GameModeCard";
import Button from "../components/Button";
import BoardSizeSelector from "../components/Customization/BoardSizeSelector";

export default function GameLobby() {
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState<BoardSize>(3);

  function handlePlayOnline() {
    void navigate(`/matchmaking?boardSize=${boardSize}`);
  }

  function handlePlayLocal() {
    void navigate(`/game/local?boardSize=${boardSize}`);
  }

  return (
    <div className="relative w-full max-w-6xl py-4">
      <div className="absolute left-0 top-16">
        <BoardSizeSelector selected={boardSize} onSelect={setBoardSize} />
      </div>

      <div className="space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pong-accent">Choose Game Mode</h1>
          <p className="mt-2 text-pong-text/70">
            Pick your battlefield and enter the arena.
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pong-accent" />
            <span className="h-1.5 w-1.5 rounded-full bg-pong-secondary" />
            <span className="h-1.5 w-1.5 rounded-full bg-shadow-grey-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <GameModeCard
            imageSrc="/playlocal.png"
            imageAlt="Play local mode"
            title="Play Local"
            description="Play with a friend on the same device"
            buttonText="Start Local Game"
            onClick={handlePlayLocal}
            color="blue"
          />
          <GameModeCard
            imageSrc="/playonline.png"
            imageAlt="Play online mode"
            title="Play Online"
            description="Play against a friend or find a match"
            buttonText="Find Match"
            onClick={handlePlayOnline}
            color="green"
          />
          <GameModeCard
            imageSrc="/playvsai.png"
            imageAlt="Play versus AI mode"
            title="Play vs AI"
            description="Challenge the computer"
            buttonText="Start AI Game"
            onClick={() => void navigate("/ai-game")}
            color="blue"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-pong-text/40">or</span>
          <Button variant="secondary" onClick={() => void navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
