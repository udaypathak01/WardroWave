import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  registerAdminStepUpHandler,
  requestAdminStepUp,
} from './adminStepUp';

describe('admin step-up coordinator', () => {
  afterEach(() => {
    registerAdminStepUpHandler(() => Promise.resolve())();
  });

  it('shares one active verification prompt between concurrent requests', async () => {
    let finishVerification: (() => void) | undefined;
    const handler = vi.fn(() => new Promise<void>((resolve) => {
      finishVerification = resolve;
    }));
    const unregister = registerAdminStepUpHandler(handler);

    const first = requestAdminStepUp('REAUTH_REQUIRED');
    const second = requestAdminStepUp('MFA_REQUIRED');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('REAUTH_REQUIRED');
    finishVerification?.();
    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined]);
    unregister();
  });

  it('reports an unavailable verification UI instead of silently retrying', async () => {
    const unregister = registerAdminStepUpHandler(() => Promise.resolve());
    unregister();

    await expect(requestAdminStepUp('REAUTH_REQUIRED')).rejects.toMatchObject({
      code: 'STEP_UP_UNAVAILABLE',
    });
  });
});
