import { ServiceError } from '@/lib/errors';

/**
 * Standard mutation error handler for TanStack Query.
 * Shows user-friendly messages via toast for ServiceError, generic fallback otherwise.
 */
export function onMutationError(error: unknown) {
  if (error instanceof ServiceError) {
    // TODO: wire to your toast system
    console.error(`[${error.domain}] ${error.message}`, error);
    return;
  }
  console.error('Mutation failed', error);
}
