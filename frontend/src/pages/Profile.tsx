import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import type { User, FriendInfo, PendingRequest } from "../types";
import { usersService } from "../services/users.service";
import { friendsService } from "../services/friends.service";
import Card from "../components/Card";
import Button from "../components/Button";
import FriendsList from "../components/FriendsList";
import PendingRequests from "../components/PendingRequests";
import FriendRequestButton from "../components/Friends/FriendRequestButton";
import ProfileStats from "../components/Profile/ProfileStats";
import AvatarUpload from "../components/Profile/AvatarUpload";
import DisplayNameForm from "../components/Profile/DisplayNameForm";

export default function Profile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();

  // Compute target user ID before any hooks.
  // isMeAlias → will redirect to /profile (no id param).
  // resolvedId null (no id, no user) → will redirect to /login.
  const isMeAlias = id === "me";
  const resolvedId: string | null = isMeAlias
    ? null
    : id != null
      ? id
      : user?.id != null
        ? user.id.toString()
        : null;

  // ── State
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Friends
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(true);

  // ── Fetch profile
  useEffect(() => {
    if (resolvedId == null) return;

    const doFetch = () => {
      setLoading(true);
      setError(null);
      usersService
        .getUserById(Number(resolvedId))
        .then((data) => setProfile(data))
        .catch((err) => setError(err instanceof Error ? err.message : "User not found"))
        .finally(() => setLoading(false));
    };

    doFetch();

    // Re-fetch when the tab regains focus so isOnline stays fresh
    const onVisible = () => {
      if (document.visibilityState === "visible") doFetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [resolvedId]);

  // ── Fetch friends list (current user's accepted friends)
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setFriendsError(null);
      setFriendsLoading(false);
      return;
    }

    let cancelled = false;

    const loadFriends = async () => {
      setFriendsLoading(true);
      setFriendsError(null);
      try {
        const data = await friendsService.getFriends();
        if (!cancelled) setFriends(data);
      } catch (err) {
        if (!cancelled) {
          setFriendsError(err instanceof Error ? err.message : "Failed to load friends");
        }
      } finally {
        if (!cancelled) setFriendsLoading(false);
      }
    };

    void loadFriends();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ── Fetch pending incoming friend requests
  useEffect(() => {
    if (!user) {
      setPendingRequests([]);
      setPendingLoading(false);
      return;
    }

    let cancelled = false;

    const loadPending = async () => {
      setPendingLoading(true);
      try {
        const data = await friendsService.getPendingRequests();
        if (!cancelled) setPendingRequests(data);
      } catch {
        // Non-critical — silently ignore
      } finally {
        if (!cancelled) setPendingLoading(false);
      }
    };

    void loadPending();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Real-time: prepend incoming friend requests to the list
  useEffect(() => {
    if (!socket || !user) return;

    const handleFriendRequest = (request: PendingRequest) => {
      setPendingRequests((prev) => [request, ...prev]);
    };

    socket.on("friend_request", handleFriendRequest);
    return () => {
      socket.off("friend_request", handleFriendRequest);
    };
  }, [socket, user]);

  // Real-time: add new friend when one of our sent requests is accepted
  useEffect(() => {
    if (!socket || !user) return;

    const handleFriendRequestAccepted = (newFriend: FriendInfo) => {
      setFriends((prev) => {
        if (prev.some((f) => f.id === newFriend.id)) return prev;
        return [...prev, newFriend];
      });
    };

    const handleFriendRemoved = (payload: { userId: number; friendId: number }) => {
      const removedId = payload.userId === user.id ? payload.friendId : payload.userId;
      setFriends((prev) => prev.filter((f) => f.id !== removedId));
    };

    socket.on("friend_request_accepted", handleFriendRequestAccepted);
    socket.on("friend_removed", handleFriendRemoved);
    return () => {
      socket.off("friend_request_accepted", handleFriendRequestAccepted);
      socket.off("friend_removed", handleFriendRemoved);
    };
  }, [socket, user]);

  // Conditional redirects AFTER all hooks
  if (isMeAlias && user?.id != null) return <Navigate to="/profile" replace />;
  if (resolvedId == null) return <Navigate to="/login" replace />;

  // ── Loading / error states
  if (loading && !profile) {
    return (
      <div className="w-full max-w-2xl mx-auto flex justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-pong-accent border-t-transparent animate-spin" />
          <p className="text-sm text-pong-text/60">Loading profile…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4">
        <Card variant="elevated">
          <p className="text-red-400">{error}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => window.history.back()}>
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  if (!profile) return null;

  // ── Handlers: friends
  async function handleRemoveFriend(friendId: number) {
    try {
      await friendsService.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove friend");
    }
  }

  async function handleAcceptRequest(requestId: number) {
    try {
      await friendsService.acceptRequest(requestId);
      const accepted = pendingRequests.find((r) => r.id === requestId);
      if (accepted) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        const newFriend: FriendInfo = {
          id: accepted.sender.id,
          username: accepted.sender.username,
          displayName: accepted.sender.displayName,
          avatarUrl: accepted.sender.avatarUrl,
          isOnline: accepted.sender.isOnline,
        };
        setFriends((prev) => [...prev, newFriend]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept request");
    }
  }

  async function handleRejectRequest(senderId: number) {
    try {
      await friendsService.rejectRequest(senderId);
      setPendingRequests((prev) => prev.filter((r) => r.senderId !== senderId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline request");
    }
  }

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  // ── Derived values
  const isMine = !!(user && user.id != null && user.id === profile.id);
  // If viewing own profile the user is clearly online — don't let a stale
  // API response or a brief socket hiccup flip the indicator to "Offline".
  const isOnline = isMine ? true : profile.isOnline;
  const displayName = profile.displayName ? profile.displayName : profile.username;
  const incomingRequestId =
    !isMine && !!user
      ? (pendingRequests.find((r) => r.sender.id === profile.id)?.id ?? null)
      : null;

  const rawAvatar = profile.avatarUrl ?? null;
  const avatarSrc =
    rawAvatar && rawAvatar.startsWith("/uploads/") && !rawAvatar.includes("default")
      ? rawAvatar
      : "/default-avatar.png";

  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  // ── Render
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <h1 className="mb-6 text-center text-4xl font-bold text-pong-accent">Profile</h1>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Profile card */}
          <Card variant="elevated">
            <div className="text-center">
              <div className="relative mx-auto mb-3 h-24 w-24">
                <AvatarUpload
                  avatarSrc={avatarSrc}
                  isMine={isMine}
                  onUploadSuccess={(url) => {
                    setProfile((prev) =>
                      prev ? { ...prev, avatarUrl: url || prev.avatarUrl } : prev,
                    );
                    updateUser({ avatarUrl: url });
                    showSuccess("Avatar updated");
                  }}
                />

                {/* Online dot */}
                <span
                  className={
                    "absolute bottom-1 right-2 h-3 w-3 rounded-full border-2 border-white " +
                    (isOnline ? "bg-green-500" : "bg-gray-400")
                  }
                />
              </div>

              {/* User infos */}
              <p className="text-lg font-semibold break-all">{profile.username}</p>
              <p className="text-sm text-pong-text/60 break-all">{displayName}</p>

              <p className="mt-2 text-xs text-pong-text/50">
                <span className={isOnline ? "text-green-500" : "text-gray-400"}>
                  {isOnline ? "Online" : "Offline"}
                </span>
                <span className="mx-2 text-pong-text/30">•</span>
                Joined {joined}
              </p>

              {isMine && (
                <DisplayNameForm
                  currentName={displayName}
                  onSaveSuccess={(newName) => {
                    setProfile((prev) =>
                      prev ? { ...prev, displayName: newName } : prev,
                    );
                    updateUser({ displayName: newName });
                    showSuccess("Profile updated");
                  }}
                />
              )}

              {/* Friendship action — only when viewing another user's profile */}
              {!isMine && user && (
                <FriendRequestButton
                  targetUserId={profile.id}
                  isMine={isMine}
                  incomingRequestId={incomingRequestId}
                  onAccept={handleAcceptRequest}
                  onDecline={handleRejectRequest}
                />
              )}

              {successMessage && (
                <p className="mt-2 text-xs text-green-400">{successMessage}</p>
              )}
            </div>
          </Card>

          {/* Stats card */}
          <ProfileStats
            wins={profile.wins}
            losses={profile.losses}
            draws={profile.draws}
          />
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {isMine ? (
            <>
              {/* Friends list */}
              <Card variant="elevated">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-pong-text/80">Friends</p>
                  {friendsLoading && (
                    <span className="text-xs text-pong-text/50">Loading…</span>
                  )}
                </div>
                {friendsError && (
                  <p className="mb-3 text-xs text-red-400">{friendsError}</p>
                )}
                {!friendsLoading && !friendsError && (
                  <FriendsList
                    friends={friends}
                    onRemoveFriend={(id) => void handleRemoveFriend(id)}
                  />
                )}
              </Card>

              {/* Pending friend requests */}
              <Card variant="elevated">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-pong-text/80">
                    Pending Requests
                    {pendingRequests.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-pong-accent px-2 py-0.5 text-xs font-bold text-pong-background">
                        {pendingRequests.length}
                      </span>
                    )}
                  </p>
                  {pendingLoading && (
                    <span className="text-xs text-pong-text/50">Loading…</span>
                  )}
                </div>
                {!pendingLoading && (
                  <PendingRequests
                    requests={pendingRequests}
                    onAccept={(id) => void handleAcceptRequest(id)}
                    onReject={(id) => void handleRejectRequest(id)}
                  />
                )}
              </Card>
            </>
          ) : (
            <Card variant="elevated">
              <p className="text-pong-text/60">Match history coming soon.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
