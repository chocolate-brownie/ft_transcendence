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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-black/10 bg-pong-background p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-pong-text">Create Tournament</h2>
        <p className="mt-1 text-sm text-pong-text/60">Set a name and bracket size.</p>

        <form
          className="mt-5 space-y-4"
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

          <fieldset className="space-y-2">
            <legend className="text-sm text-pong-text/70">Max players</legend>
            <label className="flex items-center gap-2 text-pong-text">
              <input
                type="radio"
                name="maxPlayers"
                checked={maxPlayers === 4}
                onChange={() => setMaxPlayers(4)}
              />
              4 players
            </label>
            <label className="flex items-center gap-2 text-pong-text">
              <input
                type="radio"
                name="maxPlayers"
                checked={maxPlayers === 8}
                onChange={() => setMaxPlayers(8)}
              />
              8 players
            </label>
          </fieldset>

          {validationError ? (
            <p className="text-sm text-red-500">{validationError}</p>
          ) : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
