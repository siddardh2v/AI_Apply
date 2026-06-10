// SQLite has no native JSON column type, so structured fields (parsedContent,
// analysis) are stored as JSON strings. These helpers convert at the boundary
// so the rest of the app can work with real objects.

export function toJson(value: unknown): string | undefined {
  return value == null ? undefined : JSON.stringify(value);
}

export function fromJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
