import { ApiError } from './ApiError';

export type AdminStepUpReason = 'REAUTH_REQUIRED' | 'MFA_REQUIRED';
type AdminStepUpHandler = (reason: AdminStepUpReason) => Promise<void>;

let handler: AdminStepUpHandler | null = null;
let pendingStepUp: Promise<void> | null = null;

export function registerAdminStepUpHandler(
  nextHandler: AdminStepUpHandler,
): () => void {
  handler = nextHandler;
  return () => {
    if (handler === nextHandler) handler = null;
  };
}

export function requestAdminStepUp(reason: AdminStepUpReason): Promise<void> {
  if (pendingStepUp) return pendingStepUp;
  if (!handler) {
    return Promise.reject(new ApiError(
      'Additional sign-in verification is required, but the verification prompt is unavailable.',
      reason === 'MFA_REQUIRED' ? 403 : 401,
      'STEP_UP_UNAVAILABLE',
    ));
  }

  const activeHandler = handler;
  pendingStepUp = activeHandler(reason).finally(() => {
    pendingStepUp = null;
  });
  return pendingStepUp;
}
