/**
 * Maps Firebase / Firestore errors to user-friendly copy (Phase 7).
 */
export function firebaseErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code ?? '';
    const msg = error.message.toLowerCase();

    if (code === 'permission-denied' || msg.includes('permission')) {
      return 'You do not have permission for this action. Sign in again or check Firebase rules.';
    }
    if (code === 'unavailable' || msg.includes('offline') || msg.includes('network')) {
      return 'Network or Firebase is unavailable. Check your connection and try again.';
    }
    if (code === 'not-found' || msg.includes('not found')) {
      return 'This record no longer exists.';
    }
    if (code === 'failed-precondition' || msg.includes('index')) {
      return 'Database index required. Deploy Firestore indexes from the firebase folder.';
    }
    if (msg.includes('already exists') || msg.includes('already accepted')) {
      return error.message;
    }
    return error.message || fallback;
  }
  return fallback;
}
