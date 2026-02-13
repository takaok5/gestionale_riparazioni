type RateLimitPolicy = {
  maxFailedAttempts: number;
  windowMs: number;
  retryAfterCapSeconds: number;
};

const DEFAULT_POLICY: RateLimitPolicy = {
  maxFailedAttempts: 5,
  windowMs: 60_000,
  retryAfterCapSeconds: 60,
};

const failedAttemptsByKey = new Map<string, number[]>();

function trimWindow(attempts: number[], now: number, windowMs: number): number[] {
  const minTimestamp = now - windowMs;
  return attempts.filter((ts) => ts >= minTimestamp);
}

function getRetryAfterSecondsForKey(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): number | null {
  const attempts = failedAttemptsByKey.get(key);
  if (!attempts || attempts.length === 0) {
    return null;
  }

  const inWindowAttempts = trimWindow(attempts, now, policy.windowMs);
  if (inWindowAttempts.length === 0) {
    failedAttemptsByKey.delete(key);
    return null;
  }
  failedAttemptsByKey.set(key, inWindowAttempts);

  if (inWindowAttempts.length < policy.maxFailedAttempts) {
    return null;
  }

  const oldestTimestamp = inWindowAttempts[0];
  const remainingMs = Math.max(0, oldestTimestamp + policy.windowMs - now);
  const retryAfterSeconds = Math.ceil(remainingMs / 1000);

  return Math.min(policy.retryAfterCapSeconds, Math.max(1, retryAfterSeconds));
}

function registerFailedAttemptForKey(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): void {
  const currentAttempts = failedAttemptsByKey.get(key) ?? [];
  currentAttempts.push(now);
  failedAttemptsByKey.set(key, trimWindow(currentAttempts, now, policy.windowMs));
}

function clearFailedAttemptsForKey(key: string): void {
  failedAttemptsByKey.delete(key);
}

function getRetryAfterSeconds(ip: string, now = Date.now()): number | null {
  return getRetryAfterSecondsForKey(ip, DEFAULT_POLICY, now);
}

function registerFailedAttempt(ip: string, now = Date.now()): void {
  registerFailedAttemptForKey(ip, DEFAULT_POLICY, now);
}

function clearFailedAttempts(ip: string): void {
  clearFailedAttemptsForKey(ip);
}

function resetRateLimiter(): void {
  failedAttemptsByKey.clear();
}

export {
  clearFailedAttempts,
  clearFailedAttemptsForKey,
  getRetryAfterSeconds,
  getRetryAfterSecondsForKey,
  registerFailedAttempt,
  registerFailedAttemptForKey,
  resetRateLimiter,
  type RateLimitPolicy,
};
