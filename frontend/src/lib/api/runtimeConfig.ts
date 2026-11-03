const firebaseVariables = [
  ['VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY],
  ['VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN],
  ['VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID],
  ['VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID],
] as const;

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\/+$/, '') ?? '';
  if (!trimmed) return '';

  try {
    const parsedUrl = new URL(trimmed, window.location.origin);
    const pathname = parsedUrl.pathname.replace(/\/+$/, '');

    if (!pathname || pathname === '/') {
      return `${parsedUrl.origin}/api/v1`;
    }

    if (pathname === '/api/v1' || pathname.endsWith('/api/v1')) {
      return `${parsedUrl.origin}${pathname}`;
    }

    if (pathname === '/api' || pathname.endsWith('/api')) {
      return `${parsedUrl.origin}${pathname}/v1`;
    }

    return `${parsedUrl.origin}${pathname}/api/v1`;
  } catch {
    return trimmed;
  }
}

export const missingFirebaseVariables = firebaseVariables
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const runtimeConfigErrors: string[] = [];

if (!apiBaseUrl) {
  runtimeConfigErrors.push('VITE_API_URL');
} else {
  try {
    const parsedUrl = new URL(apiBaseUrl, window.location.origin);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      runtimeConfigErrors.push('VITE_API_URL');
    }
  } catch {
    runtimeConfigErrors.push('VITE_API_URL');
  }
}

runtimeConfigErrors.push(...missingFirebaseVariables);
