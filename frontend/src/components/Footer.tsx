import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto px-6 py-4 text-center text-pong-text/80 text-sm bg-pong-surface/70 backdrop-blur-md border-t border-black/10">
      <Link to="/privacy" className="transition-colors hover:text-pong-text">
        Privacy Policy
      </Link>
      <span className="mx-2">·</span>
      <Link to="/terms" className="transition-colors hover:text-pong-text">
        Terms of Service
      </Link>
    </footer>
  );
}
