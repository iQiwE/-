import { handleStaticFallbackGet, handleStaticFallbackMutation } from './static-fallback';

function getConfiguredEnvUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    ''
  ).trim();

  if (!raw || raw === 'undefined' || raw === 'null') {
    return '';
  }
  return raw.replace(/\/$/, '');
}

function isLocalHostname(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  );
}

/**
 * Определяет, работает ли витрина в автономном режиме презентации (например, на GitHub Pages)
 * без подключенного облачного бэкенда.
 */
export function isAutonomousDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return true;
  }
  const configuredEnvUrl = getConfiguredEnvUrl();
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (!isLocalHostname(host) && !configuredEnvUrl) {
      return true;
    }
  }
  return false;
}

export function getApiBaseUrl(): string {
  const configuredEnvUrl = getConfiguredEnvUrl();

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      return `http://${host}:4000/api/v1`;
    }
    if (configuredEnvUrl) {
      return configuredEnvUrl;
    }
    return `${window.location.origin}/api/v1`;
  }

  return configuredEnvUrl || 'http://localhost:4000/api/v1';
}

function buildSafeUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  const fallbackOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:4000';

  const url =
    baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
      ? new URL(`${baseUrl}${normalizedPath}`)
      : new URL(`${baseUrl}${normalizedPath}`, fallbackOrigin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  signal?: AbortSignal,
  token?: string,
): Promise<T> {
  if (isAutonomousDemoMode()) {
    return handleStaticFallbackGet<T>(path, params);
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token && token !== 'httponly-cookie-session') {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const requestUrl = buildSafeUrl(path, params);
    const res = await fetch(requestUrl, {
      signal,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message ?? res.statusText);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 404) {
      throw err;
    }
    if (signal?.aborted) throw err;
    return handleStaticFallbackGet<T>(path, params);
  }
}

export async function apiRequest<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  if (isAutonomousDemoMode()) {
    return handleStaticFallbackMutation<T>(method, path, body);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token && token !== 'httponly-cookie-session') {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const requestUrl = buildSafeUrl(path);
    const res = await fetch(requestUrl, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = Array.isArray(errBody.message) ? errBody.message.join(', ') : errBody.message;
      throw new ApiError(res.status, msg ?? res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 404) {
      throw err;
    }
    return handleStaticFallbackMutation<T>(method, path, body);
  }
}
