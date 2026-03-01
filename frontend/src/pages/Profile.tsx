import { useEffect, useState, useRef } from "react";
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarSavingRef = useRef(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Friends
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(true);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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
    // Skip during avatar upload — file picker triggers visibilitychange
    const onVisible = () => {
      if (document.visibilityState === "visible" && !avatarSavingRef.current) doFetch();
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
          setFriendsError(
            err instanceof Error ? err.message : "Failed to load friends",
          );
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

  // ── Handlers: display name
  function handleEditClick() {
    if (!profile) return;

    const initialName = profile.displayName || profile.username;

    setEditError(null);
    setSuccessMessage(null);
    setEditDisplayName(initialName);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleDisplayNameChange(e: any) {
    setEditDisplayName(e.target.value);
  }

  function handleSave() {
    const trimmed = editDisplayName.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      setEditError("Display name must be between 1 and 50 characters.");
      return;
    }

    setSaving(true);
    setEditError(null);

    usersService
      .updateMe({ displayName: trimmed })
      .then((data) => {
        if (!profile) {
          setIsEditing(false);
          return;
        }

        const updatedProfile: User = {
          ...profile,
          displayName: data.displayName ? data.displayName : profile.displayName,
        };

        setProfile(updatedProfile);
        setIsEditing(false);
        setSuccessMessage("Profile updated");
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch((err) =>
        setEditError(err instanceof Error ? err.message : "Failed to update profile"),
      )
      .finally(() => setSaving(false));
  }

  // ── Handlers: avatar
  function handleAvatarChange(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError("File is too large (max 5MB).");
      return;
    }

    setAvatarError(null);
    handleAvatarUpload(file);
  }

  function handleAvatarUpload(file: File) {
    avatarSavingRef.current = true;
    setAvatarSaving(true);
    setAvatarError(null);

    usersService
      .uploadAvatar(file)
      .then((data) => {
        setProfile((prev) =>
          prev ? { ...prev, avatarUrl: data.avatarUrl ?? prev.avatarUrl } : prev,
        );
        updateUser({ avatarUrl: data.avatarUrl ?? "" });
        setSuccessMessage("Avatar updated");
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch((err) =>
        setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar"),
      )
      .finally(() => {
        avatarSavingRef.current = false;
        setAvatarSaving(false);
      });
  }

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

  // ── Derived values
  const isMine = user && user.id != null && user.id === profile.id;
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

  const joined = new Date(profile.createdAt).toLocaleDateString("en-US", {
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
                {/* Avatar */}
                <button
                  type="button"
                  className="group relative h-full w-full overflow-hidden rounded-full bg-black/10 focus:outline-none"
                  onClick={() => {
                    if (!isMine || avatarSaving) return;
                    // Set flag BEFORE file picker opens — visibilitychange
                    // fires before onChange, so we must guard early.
                    avatarSavingRef.current = true;
                    if (fileInputRef.current) {
                      // Reset guard if the user dismisses without selecting a file.
                      // The 'cancel' event fires on the input but isn't in React's
                      // type definitions, so we wire it up natively.
                      fileInputRef.current.addEventListener(
                        "cancel",
                        () => { avatarSavingRef.current = false; },
                        { once: true },
                      );
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={!isMine || avatarSaving}
                >
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/default-avatar.png"; }}
                  />

                  {isMine && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-xs font-semibold text-white">
                        {avatarSaving ? "Uploading..." : "Change avatar"}
                      </span>
                    </div>
                  )}
                </button>

                {isMine && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                )}

                {/* Online dot */}
                <span
                  className={
                    "absolute bottom-1 right-2 h-3 w-3 rounded-full border-2 border-white " +
                    (isOnline ? "bg-green-500" : "bg-gray-400")
                  }
                />
              </div>

              {/* User infos */}
              <p className="text-lg font-semibold">{profile.username}</p>
              <p className="text-sm text-pong-text/60">{displayName}</p>

              <p className="mt-2 text-xs text-pong-text/50">
                <span className={isOnline ? "text-green-500" : "text-gray-400"}>
                  {isOnline ? "Online" : "Offline"}
                </span>
                <span className="mx-2 text-pong-text/30">•</span>
                Joined {joined}
              </p>

              {avatarError && <p className="mt-1 text-xs text-red-400">{avatarError}</p>}

              {/* View mode */}
              {isMine && !isEditing && (
                <div className="mt-4">
                  <Button variant="primary" className="w-full" onClick={handleEditClick}>
                    Edit Profile
                  </Button>
                </div>
              )}

              {/* Edit mode */}
              {isMine && isEditing && (
                <div className="mt-4 space-y-3 text-left">
                  <div>
                    <p className="mb-1 block text-xs font-medium text-pong-text/60">
                      Display name
                    </p>
                    <input
                      type="text"
                      className="w-full rounded-md border border-black/10 bg-black/10 px-3 py-2 text-sm outline-none focus:border-pong-accent"
                      value={editDisplayName}
                      onChange={handleDisplayNameChange}
                    />
                  </div>

                  {editError && <p className="text-xs text-red-400">{editError}</p>}

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      className="flex-1"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
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
          <Card variant="elevated">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pong-text/50">
              Stats
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
                <p className="text-xs text-pong-text/50">Wins</p>
                <p className="text-lg font-bold text-pong-text/100">
                  {profile.wins ? profile.wins : 0}
                </p>
              </div>
              <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
                <p className="text-xs text-pong-text/50">Losses</p>
                <p className="text-lg font-bold text-pong-text/100">
                  {profile.losses ? profile.losses : 0}
                </p>
              </div>
              <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
                <p className="text-xs text-pong-text/50">Draws</p>
                <p className="text-lg font-bold text-pong-text/100">
                  {profile.draws ? profile.draws : 0}
                </p>
              </div>
              <div className="rounded-lg bg-white/20 border border-black/10 p-3 text-center">
                <p className="text-xs text-pong-text/50">Win Rate</p>
                <p className="text-lg font-bold text-pong-text/100">
                  {profile.wins + profile.losses + profile.draws > 0
                    ? Math.round(
                        (profile.wins / (profile.wins + profile.losses + profile.draws)) *
                          100,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </Card>
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
