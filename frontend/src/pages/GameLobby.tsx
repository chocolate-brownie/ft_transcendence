import { useNavigate } from "react-router-dom";
import GameModeCard from "../components/Lobby/GameModeCard";
import Button from "../components/Button";

export default function GameLobby() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl space-y-10 py-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pong-accent">Choose Game Mode</h1>
        <p className="mt-2 text-pong-text/70">Pick your battlefield and enter the arena.</p>
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
          onClick={() => void navigate("/game/local")}
          color="blue"
        />

        <GameModeCard
          imageSrc="/playonline.png"
          imageAlt="Play online mode"
          title="Play Online"
          description="Play against a friend or find a match"
          buttonText="Find Match"
          onClick={() => console.log("online mode next")}
          color="green"
        />

        <GameModeCard
          imageSrc="/playvsai.png"
          imageAlt="Play versus AI mode"
          title="Play vs AI"
          description="Challenge the computer"
          buttonText="Start AI Game"
          onClick={() => {}}
          color="neutral"
          disabled
          badgeText="Coming Soon"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-pong-text/40">or</span>
        <Button variant="secondary" onClick={() => void navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
