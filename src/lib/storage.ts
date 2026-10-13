const electronStore = typeof window !== 'undefined' ? window.electronAPI : undefined;

export async function getStored<T>(key: string, fallback: T): Promise<T> {
  if (electronStore) {
    try {
      const value = await electronStore.store.get(key);
      return value !== undefined ? (value as T) : fallback;
    } catch {
      return fallback;
    }
  }
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setStored<T>(key: string, value: T): void {
  if (electronStore) {
    electronStore.store.set(key, value).catch(() => { });
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function deleteStored(key: string): void {
  if (electronStore) {
    electronStore.store.delete(key).catch(() => { });
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}