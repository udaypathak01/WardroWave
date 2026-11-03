import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { requestAdminStepUp, type AdminStepUpReason } from './adminStepUp';
import { ApiError } from './ApiError';
import { apiBaseUrl } from './runtimeConfig';
import type { ApiEnvelope, ApiErrorEnvelope, ApiResult } from './types';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function isSuccessEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'success' in value &&
      value.success === true &&
      'data' in value,
  );
}

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== 'object' || !('error' in value)) return false;
  const error = value.error;
  return Boolean(
    error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string',
  );
}

function apiErrorFrom(status: number, payload: unknown): ApiError {
  if (isErrorEnvelope(payload)) {
    const { code, message, details } = payload.error;
    if (status === 429) {
      return new ApiError(
        'Too many requests. Please wait a moment and try again.',
        status,
        code || 'RATE_LIMITED',
        details,
        payload,
      );
    }
    if (status >= 500) {
      return new ApiError(
        'The service is temporarily unavailable. Please try again shortly.',
        status,
        code || 'SERVER_ERROR',
        details,
        payload,
      );
    }
    return new ApiError(message, status, code || 'API_ERROR', details, payload);
  }

  const message =
    status === 429
      ? 'Too many requests. Please wait a moment and try again.'
      : status >= 500
        ? 'The service is temporarily unavailable. Please try again shortly.'
        : status === 0
          ? 'Cannot reach the server. Check your connection and try again.'
          : `The request failed with status ${status}.`;
  return new ApiError(message, status, 'API_ERROR', undefined, payload);
}

function stepUpErrorFrom(
  status: number,
  payload: unknown,
): { error: ApiError; reason: AdminStepUpReason } | null {
  const error = apiErrorFrom(status, payload);
  if (error.code === 'REAUTH_REQUIRED') return { error, reason: 'REAUTH_REQUIRED' };
  if (error.code === 'MFA_REQUIRED') return { error, reason: 'MFA_REQUIRED' };
  return null;
}

async function completeStepUp(reason: AdminStepUpReason): Promise<void> {
  await requestAdminStepUp(reason);
}

function requestUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new ApiError(
      'The API is not configured. Set VITE_API_URL and restart the frontend.',
      0,
      'API_NOT_CONFIGURED',
    );
  }
  return `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
}

async function fetchWithToken(
  url: string,
  options: RequestOptions,
  token?: string,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData || options.body instanceof Blob) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
    credentials: 'omit',
  });
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ApiError(
      'The server returned an unexpected response.',
      response.status,
      'INVALID_API_RESPONSE',
    );
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError(
      'The server returned invalid JSON.',
      response.status,
      'INVALID_API_RESPONSE',
    );
  }
}

async function expireSession(error: ApiError): Promise<never> {
  try {
    if (auth?.currentUser) await signOut(auth);
  } catch (signOutError) {
    if (window.location.pathname !== '/login') window.location.assign('/login');
    throw new ApiError(
      'Your session has expired. Please sign in again.',
      401,
      'SESSION_EXPIRED',
      signOutError,
      error.data,
    );
  }

  if (window.location.pathname !== '/login') window.location.assign('/login');
  throw error;
}

async function send(path: string, options: RequestOptions = {}): Promise<Response> {
  const url = requestUrl(path);
  const user = auth?.currentUser;
  let token: string | undefined;

  if (user) {
    try {
      token = await user.getIdToken();
    } catch {
      throw new ApiError(
        'Unable to refresh your sign-in token. Please sign in again.',
        401,
        'TOKEN_REFRESH_FAILED',
      );
    }
  }

  let response: Response;
  try {
    response = await fetchWithToken(url, options, token);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
      error,
    );
  }

  const initialStepUpError = (response.status === 401 || response.status === 403)
    ? stepUpErrorFrom(
      response.status,
      await readJson(response.clone()).catch(() => undefined),
    )
    : null;
  if (initialStepUpError) {
    await completeStepUp(initialStepUpError.reason);
    const refreshedUser = auth?.currentUser;
    if (!refreshedUser) {
      throw new ApiError(
        'Your sign-in session ended before verification completed. Please sign in again.',
        401,
        'SESSION_EXPIRED',
      );
    }

    let refreshedToken: string;
    try {
      refreshedToken = await refreshedUser.getIdToken(true);
    } catch (tokenError) {
      throw new ApiError(
        'Unable to refresh your verified sign-in token. Please try again.',
        401,
        'TOKEN_REFRESH_FAILED',
        tokenError,
      );
    }
    try {
      response = await fetchWithToken(url, options, refreshedToken);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(
        'Cannot reach the server. Check your connection and try again.',
        0,
        'NETWORK_ERROR',
        error,
      );
    }
    if (response.status === 401 || response.status === 403) {
      const repeatedStepUpError = stepUpErrorFrom(
        response.status,
        await readJson(response.clone()).catch(() => undefined),
      );
      if (repeatedStepUpError) throw repeatedStepUpError.error;
    }
  }

  if (response.status === 401 && user) {
    let refreshedToken: string | undefined;
    try {
      refreshedToken = await user.getIdToken(true);
    } catch {
      await expireSession(apiErrorFrom(401, undefined));
    }
    if (!refreshedToken) await expireSession(apiErrorFrom(401, undefined));

    try {
      response = await fetchWithToken(url, options, refreshedToken);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(
        'Cannot reach the server. Check your connection and try again.',
        0,
        'NETWORK_ERROR',
        error,
      );
    }
  }

  if (response.status === 401) {
    const error = apiErrorFrom(401, await readJson(response).catch(() => undefined));
    if (error.code === 'USER_NOT_SYNCED') throw error;
    await expireSession(error);
  }
  return response;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const response = await send(path, options);
  const payload = await readJson(response);
  if (!response.ok) throw apiErrorFrom(response.status, payload);
  if (!isSuccessEnvelope(payload)) {
    throw new ApiError(
      'The server returned an invalid API response.',
      response.status,
      'INVALID_API_RESPONSE',
      payload,
    );
  }
  return {
    data: payload.data as T,
    ...(payload.meta ? { meta: payload.meta } : {}),
  };
}

export async function apiRequestBlob(
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await send(path, { signal });
  if (!response.ok) {
    const payload = await readJson(response).catch(() => undefined);
    throw apiErrorFrom(response.status, payload);
  }
  return response.blob();
}

function uploadWithProgress(
  url: string,
  body: FormData,
  token: string | undefined,
  onProgress?: (progress: number) => void,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    request.withCredentials = false;
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onerror = () => reject(new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    ));
    request.onabort = () => reject(new DOMException('Upload was cancelled.', 'AbortError'));
    request.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new ApiError(
          'The server returned invalid JSON.',
          request.status,
          'INVALID_API_RESPONSE',
        ));
        return;
      }
      resolve({ status: request.status, body: payload });
    };
    request.send(body);
  });
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
  onProgress?: (progress: number) => void,
): Promise<ApiResult<T>> {
  const url = requestUrl(path);
  const user = auth?.currentUser;
  let token: string | undefined;

  if (user) {
    try {
      token = await user.getIdToken();
    } catch {
      throw new ApiError(
        'Unable to refresh your sign-in token. Please sign in again.',
        401,
        'TOKEN_REFRESH_FAILED',
      );
    }
  }

  let response = await uploadWithProgress(url, body, token, onProgress);
  let stepUpError = (response.status === 401 || response.status === 403)
    ? stepUpErrorFrom(response.status, response.body)
    : null;
  if (stepUpError) {
    await completeStepUp(stepUpError.reason);
    const refreshedUser = auth?.currentUser;
    if (!refreshedUser) {
      throw new ApiError(
        'Your sign-in session ended before verification completed. Please sign in again.',
        401,
        'SESSION_EXPIRED',
      );
    }
    try {
      token = await refreshedUser.getIdToken(true);
    } catch (tokenError) {
      throw new ApiError(
        'Unable to refresh your verified sign-in token. Please try again.',
        401,
        'TOKEN_REFRESH_FAILED',
        tokenError,
      );
    }
    response = await uploadWithProgress(url, body, token, onProgress);
    stepUpError = (response.status === 401 || response.status === 403)
      ? stepUpErrorFrom(response.status, response.body)
      : null;
    if (stepUpError) throw stepUpError.error;
  }

  if (response.status === 401 && user) {
    try {
      token = await user.getIdToken(true);
    } catch {
      await expireSession(apiErrorFrom(401, response.body));
    }
    response = await uploadWithProgress(url, body, token, onProgress);
  }

  if (response.status === 401) {
    const error = apiErrorFrom(401, response.body);
    if (error.code === 'USER_NOT_SYNCED') throw error;
    await expireSession(error);
  }
  if (response.status < 200 || response.status >= 300) {
    throw apiErrorFrom(response.status, response.body);
  }
  if (!isSuccessEnvelope(response.body)) {
    throw new ApiError(
      'The server returned an invalid API response.',
      response.status,
      'INVALID_API_RESPONSE',
      response.body,
    );
  }
  onProgress?.(100);
  return {
    data: response.body.data as T,
    ...(response.body.meta ? { meta: response.body.meta } : {}),
  };
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { signal }),
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    apiRequest<T>(path, { method: 'POST', body, headers }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};
