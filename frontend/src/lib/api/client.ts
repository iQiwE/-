import { handleStaticFallbackGet, handleStaticFallbackMutation } from './static-fallback';

export function getApiBaseUrl(): string {
  const configuredEnvUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL;

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const isLocalNetwork =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.');

    if (isLocalNetwork) {
      return `http://${host}:4000/api/v1`;
    }
    if (configuredEnvUrl) {
      return configuredEnvUrl.replace(/\/$/, '');
    }
  }

  return (configuredEnvUrl ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
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
  const url = new URL(`${getApiBaseUrl()}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token && token !== 'httponly-cookie-session') {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      signal,
      headers,
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message ?? res.statusText);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
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
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token && token !== 'httponly-cookie-session') {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
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
    if (err instanceof ApiError) throw err;
    return handleStaticFallbackMutation<T>(method, path, body);
  }
}
