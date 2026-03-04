import Card from "../Card";
import Button from "../Button";

type SearchingScreenProps = {
  queuePosition: number | null;
  onCancel: () => void;
};

export default function SearchingScreen({
  queuePosition,
  onCancel,
}: SearchingScreenProps) {
  return (
    <div className="w-full max-w-lg">
      <Card variant="elevated" className="text-center">
        <div className="space-y-5">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-pong-secondary border-t-transparent" />

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-pong-text">Searching for opponent…</h1>
            <p className="text-sm text-pong-text/60">
              We're matching you with someone online.
            </p>
          </div>

          {queuePosition != null ? (
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-pong-text/80 border border-black/10">
              <span className="h-2 w-2 rounded-full bg-pong-secondary animate-pulse" />
              Position in queue: <span className="font-semibold">{queuePosition}</span>
            </div>
          ) : (
            <div className="text-sm text-pong-text/50">Joining queue…</div>
          )}

          <div className="pt-2">
            <Button
              variant="danger"
              className="w-full py-3"
              onClick={onCancel}
            >
              Cancel Search
            </Button>
          </div>

          <p className="text-xs text-pong-text/40">
            Tip: Align 3 symbols in a row to win!
          </p>
        </div>
      </Card>
    </div>
  );
}