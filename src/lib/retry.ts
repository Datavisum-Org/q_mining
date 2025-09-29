export interface RetryOptions {
  attempts: number;
  backoffMs: number;
  jitter?: number;
  onRetry?(error: unknown, attempt: number): void;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { attempts, backoffMs, jitter = 0, onRetry } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      onRetry?.(error, attempt);

      if (attempt === attempts) {
        break;
      }

      const jitterMs = jitter ? Math.random() * jitter : 0;
      const delay = backoffMs * 2 ** (attempt - 1) + jitterMs;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
