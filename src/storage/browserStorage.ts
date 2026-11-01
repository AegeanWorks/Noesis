const memory = new Map<string, string>();

function nativeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    if (!storage) return null;
    const probe = "__noesis_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function readLocal(key: string): string | null {
  const storage = nativeStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }
  return memory.get(key) ?? null;
}

export function writeLocal(key: string, value: string): void {
  const storage = nativeStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // Fall through to memory when storage is full or blocked.
    }
  }
  memory.set(key, value);
}

export function removeLocal(key: string): void {
  const storage = nativeStorage();
  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // Memory cleanup below still applies.
    }
  }
  memory.delete(key);
}
