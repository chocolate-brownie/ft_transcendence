import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  return (
    <div className="w-full max-w-md">

      {/* Header above the card */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pong-accent">Welcome Back</h1>
        <p className="text-pong-text/50 mt-2 text-sm">Sign in to continue playing</p>
      </div>

      <Card variant="elevated">
        <form className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full mt-2">
            Log In
          </Button>
        </form>
      </Card>


      {/* Footer link */}
      <p className="mt-6 text-sm text-center text-pong-text/40">
        Don’t have an account?{" "}
        <a href="/signup" className="text-pong-accent hover:text-pong-accent/70 transition-colors">
          Sign up
        </a>
      </p>

    </div>
  );
}
