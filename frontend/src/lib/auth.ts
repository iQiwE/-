export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: 'LANDLORD' | 'TENANT' | 'ADMIN';
}

export interface AuthSession {
  token: string;
  user: SessionUser;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  document.cookie = `auth_token=${encodeURIComponent(session.token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'auth_token=; path=/; max-age=0';
}

