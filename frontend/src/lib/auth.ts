import { getApiBaseUrl } from './api/client';

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: 'LANDLORD' | 'TENANT' | 'ADMIN';
}

export interface AuthSession {
  token?: string;
  user: SessionUser;
}

const LEGACY_TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
export const HTTPONLY_COOKIE_SENTINEL = 'httponly-cookie-session';

/**
 * Сохраняет только нечувствительный публичный профиль пользователя для UI.
 * Сам JWT-токен устанавливается бэкендом в защищенную HttpOnly + Secure cookie
 * и недоступен для чтения из JavaScript (защита от XSS-кражи токенов).
 */
export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getSessionUser() ? HTTPONLY_COOKIE_SENTINEL : null;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}
