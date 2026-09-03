let globalAdLock = false;

export async function acquireGlobalAdLock(): Promise<boolean> {
  while (globalAdLock) {
    await new Promise((resolve) => window.setTimeout(resolve, 5000));
  }
  globalAdLock = true;
  return true;
}

export function releaseGlobalAdLock(): void {
  globalAdLock = false;
}
