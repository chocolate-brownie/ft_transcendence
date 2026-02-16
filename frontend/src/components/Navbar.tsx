import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-pong-dark border-b border-white/10">
      <Link to="/" className="text-xl font-bold text-pong-accent">
        ft_transcendence
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/game" className="text-pong-light/80 hover:text-pong-light">Play</Link>
        <Link to="/tournaments" className="text-pong-light/80 hover:text-pong-light">Tournaments</Link>
        <Link to="/leaderboard" className="text-pong-light/80 hover:text-pong-light">Leaderboard</Link>
        <Link to="/login" className="text-pong-light/80 hover:text-pong-light">Login</Link>
      </div>
    </nav>
  );
}
