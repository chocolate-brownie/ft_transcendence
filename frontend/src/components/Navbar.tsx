import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate("/");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-pong-surface/60 backdrop-blur-md border-b border-black/10">
      <Link to="/" className="text-xl font-bold text-pong-accent">
        Home
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/game" className="text-pong-text/80 hover:text-pong-text">
          Play
        </Link>
        <Link to="/tournaments" className="text-pong-text/80 hover:text-pong-text">
          Tournaments
        </Link>
        <Link to="/leaderboard" className="text-pong-text/80 hover:text-pong-text">
          Leaderboard
        </Link>

        {user ? (
          <>
            <Link
              to="/profile"
              className="text-pong-secondary font-medium hover:text-pong-secondary/80"
            >
              {user.username}
            </Link>
            <button
              onClick={handleLogout}
              className="text-pong-text/60 hover:text-red-400 transition-colors text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="text-pong-text/80 hover:text-pong-text">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
