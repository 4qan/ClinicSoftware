export function withTimestamps<T extends Record<string, unknown>>(
  data: T,
  isNew: boolean,
): T & { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()

  if (isNew) {
    return { ...data, createdAt: now, updatedAt: now } as T & { createdAt: string; updatedAt: string }
  }

  return { ...data, updatedAt: now } as T & { createdAt: string; updatedAt: string }
}
