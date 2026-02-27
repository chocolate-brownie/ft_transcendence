import { useEffect, useState } from "react";
import type { FriendshipStatus } from "../../types";
import { friendsService } from "../../services/friends.service";
import Button from "../Button";

interface FriendRequestButtonProps {
  targetUserId: number;
  isMine: boolean;
  incomingRequestId?: number | null;
  onAccept: (requestId: number) => Promise<void>;
  onDecline: (targetUserId: number) => Promise<void>;
}

export default function FriendRequestButton({
  targetUserId,
  isMine,
  incomingRequestId = null,
  onAccept,
  onDecline,
}: FriendRequestButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMine) return;

    let cancelled = false;

    const loadStatus = async () => {
      setError(null);
      try {
        const nextStatus = await friendsService.getFriendshipStatus(targetUserId);
        if (!cancelled) setStatus(nextStatus);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load friendship status");
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [targetUserId, isMine]);

  async function handleSendRequest() {
    setLoading(true);
    setError(null);
    try {
      await friendsService.sendRequest(targetUserId);
      setStatus("pending_sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send friend request");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!incomingRequestId) {
      setError("Request not found");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onAccept(incomingRequestId);
      setStatus("friends");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept request");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    setLoading(true);
    setError(null);
    try {
      await onDecline(targetUserId);
      setStatus("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline request");
    } finally {
      setLoading(false);
    }
  }

  if (isMine) return null;

  return (
    <div className="mt-4">
      {status === "friends" ? (
        <Button variant="lime" className="w-full cursor-default" disabled>
          Friends ✓
        </Button>
      ) : status === "pending_received" ? (
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => void handleAccept()}>
            Accept
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => void handleDecline()}>
            Decline
          </Button>
        </div>
      ) : status === "pending_sent" ? (
        <Button variant="secondary" className="w-full" disabled>
          Request Sent
        </Button>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => void handleSendRequest()}
          disabled={loading}
        >
          {loading ? "Sending..." : "Add Friend"}
        </Button>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
