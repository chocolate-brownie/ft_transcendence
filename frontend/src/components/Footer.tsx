import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="px-6 py-4 text-center text-pong-light/30 text-sm border-t border-white/10">
      <Link to="/privacy" className="hover:text-pong-light/60">Privacy Policy</Link>
      <span className="mx-2">·</span>
      <Link to="/terms" className="hover:text-pong-light/60">Terms of Service</Link>
    </footer>
  );
}
