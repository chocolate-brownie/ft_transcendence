import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function GameLobby() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-pong-text">Game Lobby</h1>
      <p className="text-sm text-pong-text/60">
        Later here: matchmaking, invites...
      </p>
      <Link to="/game/demo">
        <Button variant="primary" className="mt-2">
          Preview game board
        </Button>
      </Link>
    </div>
  );
}
