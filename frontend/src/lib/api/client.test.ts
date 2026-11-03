import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, apiUpload } from './client';

const { mockAuth, requestAdminStepUp } = vi.hoisted(() => ({
  mockAuth: {
    currentUser: null as {
      getIdToken: (forceRefresh?: boolean) => Promise<string>;
    } | null,
  },
  requestAdminStepUp: vi.fn(),
}));

vi.mock('../../config/firebase', () => ({ auth: mockAuth }));
vi.mock('./adminStepUp', () => ({ requestAdminStepUp }));

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockAuth.currentUser = null;
    requestAdminStepUp.mockReset();
  });

  it('unwraps successful API envelopes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: { id: 'item-1' }, meta: { page: 1 } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest<{ id: string }>('/products')).resolves.toEqual({
      data: { id: 'item-1' },
      meta: { page: 1 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/products$/),
      expect.objectContaining({ method: 'GET', credentials: 'omit' }),
    );
  });

  it('maps rate-limit responses to a friendly API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    )));

    await expect(apiRequest('/contact', { method: 'POST', body: {} }))
      .rejects.toMatchObject({
        name: 'ApiError',
        status: 429,
        message: 'Too many requests. Please wait a moment and try again.',
      });
  });

  it.each([
    [401, 'REAUTH_REQUIRED'],
    [403, 'MFA_REQUIRED'],
  ] as const)('verifies and retries %s %s responses once', async (status, code) => {
    const getIdToken = vi.fn()
      .mockResolvedValueOnce('before-verification')
      .mockResolvedValueOnce('after-verification');
    mockAuth.currentUser = { getIdToken };
    requestAdminStepUp.mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: false,
        error: { code, message: 'Verification required' },
      }), { status, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        data: { updated: true },
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/admin/settings', { method: 'PATCH', body: { enabled: true } }))
      .resolves.toMatchObject({ data: { updated: true } });
    expect(requestAdminStepUp).toHaveBeenCalledWith(code);
    expect(getIdToken).toHaveBeenNthCalledWith(1);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not open repeated step-up prompts when verification did not satisfy the gate', async () => {
    const getIdToken = vi.fn()
      .mockResolvedValueOnce('before-verification')
      .mockResolvedValueOnce('after-verification');
    mockAuth.currentUser = { getIdToken };
    requestAdminStepUp.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: false,
        error: { code: 'MFA_REQUIRED', message: 'Verification required' },
      }), { status: 403, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: false,
        error: { code: 'MFA_REQUIRED', message: 'Verification required' },
      }), { status: 403, headers: { 'content-type': 'application/json' } })));

    await expect(apiRequest('/admin/settings'))
      .rejects.toMatchObject({ code: 'MFA_REQUIRED', status: 403 });
    expect(requestAdminStepUp).toHaveBeenCalledTimes(1);
  });

  it('resumes uploads with a refreshed token after re-authentication', async () => {
    const getIdToken = vi.fn()
      .mockResolvedValueOnce('before-verification')
      .mockResolvedValueOnce('after-verification');
    mockAuth.currentUser = { getIdToken };
    requestAdminStepUp.mockResolvedValue(undefined);
    const replies = [
      {
        status: 401,
        payload: { success: false, error: { code: 'REAUTH_REQUIRED', message: 'Verify again' } },
      },
      { status: 200, payload: { success: true, data: { url: 'https://example.test/image' } } },
    ];
    const sentBodies: FormData[] = [];
    class MockXMLHttpRequest {
      upload = {};
      status = 0;
      responseText = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onabort: (() => void) | null = null;

      open() {}

      setRequestHeader() {}

      send(body: FormData) {
        sentBodies.push(body);
        const reply = replies.shift();
        if (!reply) throw new Error('No mocked upload response remains.');
        this.status = reply.status;
        this.responseText = JSON.stringify(reply.payload);
        this.onload?.();
      }
    }
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);

    const formData = new FormData();
    formData.append('file', new Blob(['image']));
    await expect(apiUpload('/users/me/wardrobe', formData))
      .resolves.toMatchObject({ data: { url: 'https://example.test/image' } });

    expect(requestAdminStepUp).toHaveBeenCalledWith('REAUTH_REQUIRED');
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(sentBodies).toEqual([formData, formData]);
  });
});
