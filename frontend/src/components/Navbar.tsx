import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-pong-surface/60 backdrop-blur-md border-b border-black/10">
      <Link to="/" className="text-xl font-bold text-pong-accent">
        Home
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/game" className="text-pong-text/80 hover:text-pong-text">Play</Link>
        <Link to="/tournaments" className="text-pong-text/80 hover:text-pong-text">Tournaments</Link>
        <Link to="/leaderboard" className="text-pong-text/80 hover:text-pong-text">Leaderboard</Link>
        <Link to="/login" className="text-pong-text/80 hover:text-pong-text">Login</Link>
      </div>
    </nav>
  );
}
