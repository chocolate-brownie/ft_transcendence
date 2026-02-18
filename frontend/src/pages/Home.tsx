import { useState, useEffect } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

type HealthStatus = {
  status: string;
  timestamp: string;
  database: string;
} | null;

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: "ok" | "error" | "loading" | "pending";
}) {
  const colors = {
    ok: "bg-green-500",
    error: "bg-red-500",
    loading: "bg-yellow-500 animate-pulse",
    pending: "bg-gray-500",
  };

  const labels = {
    ok: "Connected",
    error: "Error",
    loading: "Connecting...",
    pending: "Not tested yet",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-pong-light/80">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />
        <span className="text-sm text-pong-light/50">{labels[status]}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-5xl font-bold text-pong-accent mb-2">ft_transcendence</h1>
      <p className="text-pong-light/60 text-lg mb-10">
        The Ultimate Multiplayer Tic-Tac-Toe Experience
      </p>

      <Card title="System Status" className="w-full max-w-md">
        <div className="space-y-3">
          <StatusRow label="Frontend (React)" status="ok" />
          <StatusRow
            label="Backend (Express)"
            status={health ? "ok" : error ? "error" : "loading"}
          />
          <StatusRow
            label="Database (PostgreSQL)"
            status={health?.database === "connected" ? "ok" : error ? "error" : "loading"}
          />
          <StatusRow label="WebSocket (Socket.io)" status="pending" />
        </div>

        {error && <p className="mt-4 text-sm text-red-400">Backend error: {error}</p>}
      </Card>

      <Card title="UI Components Demo" className="w-full max-w-md mt-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-pong-light/50 mb-2">Buttons</p>
            <div className="flex gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-pong-light/50 mb-2">Disabled Buttons</p>
            <div className="flex gap-3">
              <Button variant="primary" disabled>
                Primary
              </Button>
              <Button variant="secondary" disabled>
                Secondary
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-pong-light/50 mb-2">Inputs</p>
            <div className="space-y-3">
              <Input label="Username" placeholder="Enter your name" />
              <Input label="Email" type="email" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <p className="text-sm text-pong-light/50 mb-2">Card Variants</p>
            <div className="space-y-3">
              <Card variant="default" title="Default">
                <p className="text-sm text-pong-light/60">Glass morphism border</p>
              </Card>
              <Card variant="elevated" title="Elevated">
                <p className="text-sm text-pong-light/60">Stronger contrast</p>
              </Card>
              <Card variant="flat" title="Flat">
                <p className="text-sm text-pong-light/60">No border</p>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
