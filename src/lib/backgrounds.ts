const API_PREFIX = "/api/backgrounds/file";
const STORAGE_PREFIX = "screen-backgrounds/";

export function normalizeBackgroundImageUrl(raw?: string | null): string | null {
  if (!raw) {
    return raw ?? null;
  }

  if (raw.startsWith(API_PREFIX)) {
    return raw;
  }

  const index = raw.indexOf(STORAGE_PREFIX);
  if (index === -1) {
    return raw;
  }

  const key = raw.slice(index);
  return `${API_PREFIX}?key=${encodeURIComponent(key)}`;
}
