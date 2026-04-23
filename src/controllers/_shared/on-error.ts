import { toast } from 'sonner';
import { ServiceError } from '@/lib/errors';

/**
 * Standard mutation error handler for TanStack Query.
 * Surfaces `ServiceError` messages via toast; logs details for debugging.
 */
export function onMutationError(error: unknown) {
  if (error instanceof ServiceError) {
    toast.error(error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${error.domain}] ${error.message}`, error);
    }
    return;
  }
  toast.error('Something went wrong. Please try again.');
  console.error('Mutation failed', error);
}
