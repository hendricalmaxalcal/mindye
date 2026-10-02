const KEY = "lastBackupAt";

export function getLastBackup() {
  try {
    const value = localStorage.getItem(KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
}

export function markBackupDone() {
  try {
    localStorage.setItem(KEY, new Date().toISOString());
  } catch {
    // Not critical, so ignore.
  }
}