import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format.";
    if (!password) return "Password is required.";
    return null;
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      void navigate("/");
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pong-accent">Welcome Back</h1>
        <p className="text-pong-text/50 mt-2 text-sm">Sign in to continue playing</p>
      </div>

      <Card variant="elevated">
        <form className="space-y-5" onSubmit={(e) => { void handleSubmit(e); }} noValidate>
          {/* Error banner */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>
      </Card>

      {/* Footer link */}
      <p className="mt-6 text-sm text-center text-pong-text/40">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className="text-pong-accent hover:text-pong-accentDark transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
