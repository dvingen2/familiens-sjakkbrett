import type { CSSProperties } from "react";
import { getProfileColor, getProfileInitials } from "../lib/profile";
import type { Profile } from "../types";

interface ProfileAvatarProps {
  profile: Pick<Profile, "id" | "displayName" | "avatarSeed">;
  size?: "sm" | "md";
}

export function ProfileAvatar({ profile, size = "md" }: ProfileAvatarProps) {
  return (
    <span
      className={`profile-avatar profile-avatar-${size}`}
      style={{ "--avatar-color": getProfileColor(profile) } as CSSProperties}
      aria-hidden="true"
    >
      {getProfileInitials(profile.displayName)}
    </span>
  );
}
