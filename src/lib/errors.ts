export class APIError extends Error {
  readonly status?: number;
  readonly payload?: unknown;
  readonly rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };

  constructor(
    message: string,
    status?: number,
    payload?: unknown,
    rateLimit?: { limit: number; remaining: number; resetAt: string },
  ) {
    super(message);
    this.name = "APIError";
    if (status !== undefined) {
      this.status = status;
    }
    if (payload !== undefined) {
      this.payload = payload;
    }
    if (rateLimit !== undefined) {
      this.rateLimit = rateLimit;
    }
  }
}

export class ExternalApiError extends APIError {
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    status?: number,
    retryAfterSeconds?: number,
    payload?: unknown,
    rateLimit?: { limit: number; remaining: number; resetAt: string },
  ) {
    super(message, status, payload, rateLimit);
    this.name = "ExternalApiError";
    if (retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
}

export class ValidationError extends APIError {
  constructor(message: string, payload?: unknown) {
    super(message, 400, payload);
    this.name = "ValidationError";
  }
}
