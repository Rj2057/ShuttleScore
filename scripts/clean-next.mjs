import { access, chmod, rm } from 'node:fs/promises';

const targets = [
  '.next/trace',
  '.next/lock',
  '.next-cache/trace',
  '.next-cache/lock',
  '.next-cache',
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function removeWithRetry(path) {
  if (!(await exists(path))) {
    return;
  }

  try {
    // Windows can mark files read-only when previously locked.
    await chmod(path, 0o666);
  } catch {
    // Best effort.
  }

  try {
    await rm(path, {
      force: true,
      recursive: true,
      maxRetries: 8,
      retryDelay: 150,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[clean-next] Could not remove ${path}: ${message}`);
  }
}

for (const path of targets) {
  await removeWithRetry(path);
}
