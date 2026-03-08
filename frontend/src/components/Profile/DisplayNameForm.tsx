import { useState } from "react";
import { usersService } from "../../services/users.service";
import Button from "../Button";

interface DisplayNameFormProps {
  currentName: string;
  onSaveSuccess: (newDisplayName: string) => void;
}

export default function DisplayNameForm({
  currentName,
  onSaveSuccess,
}: DisplayNameFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function handleEditClick() {
    setEditError(null);
    setEditDisplayName(currentName);
    setIsEditing(true);
  }

  if (!isEditing) {
    return (
      <div className="mt-4">
        <Button variant="primary" className="w-full" onClick={handleEditClick}>
          Edit Profile
        </Button>
      </div>
    );
  }

  function handleSave() {
    const trimmed = editDisplayName.trim().replace(/<[^>]*>/g, "");
    if (trimmed.length < 3 || trimmed.length > 50) {
      setEditError("Display name must be between 3 and 50 characters.");
      return;
    }

    setSaving(true);
    setEditError(null);

    usersService
      .updateMe({ displayName: trimmed })
      .then((data) => {
        onSaveSuccess(data.displayName ?? trimmed);
        setIsEditing(false);
      })
      .catch((err) =>
        setEditError(err instanceof Error ? err.message : "Failed to update profile"),
      )
      .finally(() => setSaving(false));
  }

  return (
    <div className="mt-4 space-y-3 text-left">
      <div>
        <label
          htmlFor="display-name"
          className="mb-1 block text-xs font-medium text-pong-text/60"
        >
          Display name
        </label>
        <input
          id="display-name"
          name="display-name"
          type="text"
          className="w-full rounded-md border border-black/10 bg-black/10 px-3 py-2 text-sm outline-none focus:border-pong-accent"
          value={editDisplayName}
          onChange={(e) => setEditDisplayName(e.target.value)}
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
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
