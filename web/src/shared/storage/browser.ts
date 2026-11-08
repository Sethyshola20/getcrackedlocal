export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function createBrowserStorage(resolve: () => StoragePort) {
  return {
    read(key: string): string | null {
      try {
        return resolve().getItem(key);
      } catch {
        return null;
      }
    },
    write(key: string, value: string): boolean {
      try {
        resolve().setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key: string): boolean {
      try {
        resolve().removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}
export const tabStorage = createBrowserStorage(() => window.sessionStorage);
export const persistentStorage = createBrowserStorage(
  () => window.localStorage,
);
export function parseStoredJSON(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
