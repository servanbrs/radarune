export function serializeForJson<T>(value: T): T {
  if (typeof value === "bigint") {
    return value.toString() as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeForJson(entry)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeForJson(entry)]),
    ) as T;
  }

  return value;
}
