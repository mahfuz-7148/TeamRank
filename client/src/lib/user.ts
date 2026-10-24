import type { User } from "@/types";

const STORAGE_KEY = "teamrank.user";

interface StoredUser {
  id: string;
  username: string;
}

export function getSavedUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredUser>;
    if (
      typeof parsed.id === "string" &&
      parsed.id.length > 0 &&
      typeof parsed.username === "string" &&
      parsed.username.length > 0
    ) {
      return { id: parsed.id, username: parsed.username };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  const stored: StoredUser = { id: user.id, username: user.username };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage may be unavailable (private mode); ignore silently
  }
}

export function clearSavedUser(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
