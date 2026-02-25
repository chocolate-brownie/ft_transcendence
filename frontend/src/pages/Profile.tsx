import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";
import { usersService } from "../services/users.service";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();

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

  // All hooks unconditionally at the top — React rules of hooks
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Conditional redirects AFTER all hooks
  if (isMeAlias && user?.id != null) return <Navigate to="/profile" replace />;
  if (resolvedId == null) return <Navigate to="/login" replace />;

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

  function handleEditClick() {
    if (!profile) return;

    let initialName = "";

    if (profile.displayName) {
      initialName = profile.displayName;
    } else {
      initialName = profile.username;
    }

    setEditError(null);
    setSuccessMessage(null);
    setEditDisplayName(initialName);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleDisplayNameChange(e: React.ChangeEvent<HTMLInputElement>) {
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
          // avatarUrl: data.avatarUrl ? data.avatarUrl : profile.avatarUrl, // pour plus tard
        };

        setProfile(updatedProfile);
        setIsEditing(false);
        setSuccessMessage("Profile updated");
        setTimeout(() => setSuccessMessage(null), 3000);
      })
      .catch((err) => setEditError(err instanceof Error ? err.message : "Failed to update profile"))
      .finally(() => setSaving(false));
  }

  const isMine = user && user.id != null && user.id === profile.id;
  const displayName = profile.displayName ? profile.displayName : profile.username;
  const avatarSrc = profile.avatarUrl ? profile.avatarUrl : "/logo.png";
  const joined = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

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
                <div className="h-full w-full overflow-hidden rounded-full bg-black/10">
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span
                  className={
                    "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white " +
                    (profile.isOnline ? "bg-green-500" : "bg-gray-400")
                  }
                />
              </div>

              <p className="text-lg font-semibold">{profile.username}</p>
              <p className="text-sm text-pong-text/60">{displayName}</p>

              <p className="mt-2 text-xs text-pong-text/50">
                <span className={profile.isOnline ? "text-green-500" : "text-gray-400"}>
                  {profile.isOnline ? "Online" : "Offline"}
                </span>
                <span className="mx-2 text-pong-text/30">•</span>
                Joined {joined}
              </p>

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
        <Card variant="elevated">
          <p className="text-pong-text/60">Match history / friends coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
