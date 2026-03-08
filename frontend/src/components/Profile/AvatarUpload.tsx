import { useRef, useState } from "react";
import { usersService } from "../../services/users.service";

interface AvatarUploadProps {
  avatarSrc: string;
  isMine: boolean;
  onUploadSuccess: (avatarUrl: string) => void;
}

export default function AvatarUpload({
  avatarSrc,
  isMine,
  onUploadSuccess,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarSavingRef = useRef(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  function handleAvatarChange(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError(null);

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError("File is too large (max 5MB).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    handleAvatarUpload(file);
  }

  function handleAvatarUpload(file: File) {
    avatarSavingRef.current = true;
    setAvatarSaving(true);
    setAvatarError(null);

    usersService
      .uploadAvatar(file)
      .then((data) => {
        onUploadSuccess(data.avatarUrl ?? "");
      })
      .catch((err) =>
        setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar"),
      )
      .finally(() => {
        avatarSavingRef.current = false;
        setAvatarSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  }

  return (
    <>
      <button
        type="button"
        className="group relative h-full w-full overflow-hidden rounded-full bg-black/10 focus:outline-none"
        onClick={() => {
          if (!isMine || avatarSaving) return;
          avatarSavingRef.current = true;
          if (fileInputRef.current) {
            fileInputRef.current.addEventListener(
              "cancel",
              () => {
                avatarSavingRef.current = false;
              },
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
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.png";
          }}
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

      {avatarError && <p className="mt-1 text-xs text-red-400">{avatarError}</p>}
    </>
  );
}
