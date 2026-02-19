import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="px-6 py-4 text-center text-pong-text/30 text-sm bg-pong-surface/60 backdrop-blur-md border-t border-black/10">
      <Link to="/privacy" className="hover:text-pong-text/60">Privacy Policy</Link>
      <span className="mx-2">·</span>
      <Link to="/terms" className="hover:text-pong-text/60">Terms of Service</Link>
    </footer>
  );
}
