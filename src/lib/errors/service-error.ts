export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'OFFLINE'
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'CONFLICT'
  | 'WRITE_FAILED'
  | 'READ_FAILED'
  | 'UNKNOWN';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly domain: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/** Map a raw Firestore/Firebase error to a typed ServiceError. */
export function toServiceError(domain: string, operation: string, cause: unknown): ServiceError {
  const raw = cause as { code?: string; message?: string } | undefined;
  const rawCode = raw?.code ?? '';

  if (rawCode === 'permission-denied') {
    return new ServiceError(
      `You do not have permission to perform this ${operation}.`,
      'PERMISSION_DENIED',
      domain,
      cause,
    );
  }
  if (rawCode === 'unavailable' || /offline/i.test(String(cause))) {
    return new ServiceError(
      `Cannot ${operation} while offline. Changes will sync when you reconnect.`,
      'OFFLINE',
      domain,
      cause,
    );
  }
  if (rawCode === 'unauthenticated') {
    return new ServiceError(
      `Please sign in again to ${operation}.`,
      'UNAUTHENTICATED',
      domain,
      cause,
    );
  }
  if (rawCode === 'not-found') {
    return new ServiceError(`Requested ${domain} not found.`, 'NOT_FOUND', domain, cause);
  }
  if (/invalid data|unsupported field/i.test(String(raw?.message ?? ''))) {
    return new ServiceError(
      `Invalid data for ${domain} ${operation}.`,
      'VALIDATION',
      domain,
      cause,
    );
  }
  return new ServiceError(
    `Failed to ${operation} ${domain}.`,
    operation.startsWith('read') ? 'READ_FAILED' : 'WRITE_FAILED',
    domain,
    cause,
  );
}

export async function withService<T>(
  domain: string,
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ServiceError) throw e;
    const mapped = toServiceError(domain, operation, e);
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error(`[service:${domain}] ${operation} failed`, mapped, { cause: e });
    }
    throw mapped;
  }
}
