const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

const failedAttemptsByIp = new Map<string, number[]>();

function trimWindow(attempts: number[], now: number): number[] {
  const minTimestamp = now - RATE_LIMIT_WINDOW_MS;
  return attempts.filter((ts) => ts >= minTimestamp);
}

function getRetryAfterSeconds(ip: string, now = Date.now()): number | null {
  const attempts = failedAttemptsByIp.get(ip);
  if (!attempts || attempts.length === 0) {
    return null;
  }

  const inWindowAttempts = trimWindow(attempts, now);
  if (inWindowAttempts.length === 0) {
    failedAttemptsByIp.delete(ip);
    return null;
  }
  failedAttemptsByIp.set(ip, inWindowAttempts);

  if (inWindowAttempts.length < MAX_FAILED_ATTEMPTS) {
    return null;
  }

  const oldestTimestamp = inWindowAttempts[0];
  const remainingMs = Math.max(0, oldestTimestamp + RATE_LIMIT_WINDOW_MS - now);
  const retryAfterSeconds = Math.ceil(remainingMs / 1000);

  return Math.min(60, Math.max(1, retryAfterSeconds));
}

function registerFailedAttempt(ip: string, now = Date.now()): void {
  const currentAttempts = failedAttemptsByIp.get(ip) ?? [];
  currentAttempts.push(now);
  failedAttemptsByIp.set(ip, trimWindow(currentAttempts, now));
}

function clearFailedAttempts(ip: string): void {
  failedAttemptsByIp.delete(ip);
}

function resetRateLimiter(): void {
  failedAttemptsByIp.clear();
}

export {
  clearFailedAttempts,
  getRetryAfterSeconds,
  registerFailedAttempt,
  resetRateLimiter,
};
