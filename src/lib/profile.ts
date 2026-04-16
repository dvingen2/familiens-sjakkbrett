import type { Profile } from "../types";

const PROFILE_COLORS = [
  "#2f6f4f",
  "#b36b3e",
  "#4867b7",
  "#a04e7b",
  "#7a5a2a",
  "#2c7a86",
] as const;

export function getProfileInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getProfileColor(profile: Pick<Profile, "id">) {
  let hash = 0;
  for (const char of profile.id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return PROFILE_COLORS[hash % PROFILE_COLORS.length];
}
