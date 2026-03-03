import { useState } from "react";
import Button from "../Button";
import Input from "../Input";

interface CreateTournamentModalProps {
  onClose: () => void;
  onCreate: (name: string, maxPlayers: 4 | 8) => Promise<void>;
  isCreating: boolean;
  error: string | null;
}

export default function CreateTournamentModal({
  onClose,
  onCreate,
  isCreating,
  error,
}: CreateTournamentModalProps) {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<4 | 8>(8);
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 3 || trimmed.length > 50) {
      setValidationError("Tournament name must be 3-50 characters.");
      return;
    }

    setValidationError(null);
    await onCreate(trimmed, maxPlayers);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/70 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-pong-text">Create Tournament</h2>
            <p className="mt-0.5 text-sm text-pong-text/50">
              Set a name and bracket size.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1 text-pong-text/40 transition-colors hover:bg-black/8 hover:text-pong-text"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            void submit(e);
          }}
        >
          <Input
            label="Tournament Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={3}
            maxLength={50}
            placeholder="Weekend Championship"
            required
          />

          {/* Bracket size toggle */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-pong-text/70">
              Bracket size
            </legend>
            <div className="flex gap-3">
              {([4, 8] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPlayers(n)}
                  className={`flex flex-1 flex-col items-center rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    maxPlayers === n
                      ? "border-pong-accent bg-pong-accent/10 text-pong-accent ring-1 ring-pong-accent/30"
                      : "border-black/10 bg-black/5 text-pong-text/60 hover:border-black/20 hover:bg-black/8"
                  }`}
                >
                  <span className="text-xl font-bold">{n}</span>
                  <span className="mt-0.5 text-xs font-medium uppercase tracking-wide opacity-70">
                    Players
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {validationError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {validationError}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
