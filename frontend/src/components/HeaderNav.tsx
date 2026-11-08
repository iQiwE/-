'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSessionUser, SessionUser } from '@/lib/auth';
import { useTheme } from './ThemeProvider';

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const cached = getSessionUser();
    setUser(cached);

    const token = localStorage.getItem('auth_token');
    if (token) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((dbUser) => {
          if (dbUser && dbUser.id) {
            setUser(dbUser);
            localStorage.setItem('auth_user', JSON.stringify(dbUser));
          }
        })
        .catch(() => {});
    }
  }, [pathname]);

  function handleLogout() {
    clearSession();
    setUser(null);
    router.push('/catalog');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8DFD3] bg-[#FAF6F0]/90 backdrop-blur-md transition-colors duration-300 dark:border-white/10 dark:bg-[#141312]/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-3 font-serif text-xl font-medium tracking-tight text-[#2C221E] transition dark:text-[#F5F3EF]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B85D3B]/30 bg-[#B85D3B] font-serif text-xs font-semibold tracking-wider text-white transition group-hover:scale-105 dark:border-[#B89778]/40 dark:bg-[#B89778] dark:text-[#141312]">
              ВКО
            </span>
            <span className="flex items-baseline gap-1.5">
              <span>Serenity</span>
              <span className="font-serif text-base italic font-normal text-[#B85D3B] dark:text-[#B89778]">
                Residence
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-xs font-medium uppercase tracking-[0.14em] md:flex">
            <Link
              href="/catalog"
              className={`transition hover:text-[#B85D3B] dark:hover:text-[#D4B89C] ${
                pathname === '/catalog'
                  ? 'text-[#B85D3B] dark:text-[#D4B89C]'
                  : 'text-[#5C4D44] dark:text-[#A8A096]'
              }`}
            >
              Каталог
            </Link>
            {user?.role === 'TENANT' && (
              <Link
                href="/favorites"
                className={`inline-flex items-center gap-1.5 transition hover:text-[#B85D3B] dark:hover:text-[#D4B89C] ${
                  pathname === '/favorites'
                    ? 'text-[#B85D3B] dark:text-[#D4B89C]'
                    : 'text-[#5C4D44] dark:text-[#A8A096]'
                }`}
              >
                <span className="text-[#B85D3B] dark:text-[#B89778]">♥</span> Избранное
              </Link>
            )}
            {user?.role === 'LANDLORD' && (
              <Link
                href="/landlord"
                className={`transition hover:text-[#B85D3B] dark:hover:text-[#D4B89C] ${
                  pathname === '/landlord'
                    ? 'text-[#B85D3B] dark:text-[#D4B89C]'
                    : 'text-[#5C4D44] dark:text-[#A8A096]'
                }`}
              >
                Кабинет арендодателя
              </Link>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-sm">
          {/* Переключатель темы Dark Luxury / Light Earthy */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему'}
            title={theme === 'dark' ? 'Переключить на светлую тему (Warm Earthy)' : 'Переключить на темную тему (Dark Luxury)'}
            className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border border-[#DFD3C3] bg-white px-3.5 py-2 text-xs font-medium text-[#2C221E] shadow-2xs transition hover:border-[#B85D3B] hover:text-[#B85D3B] dark:border-white/15 dark:bg-[#1E1C1A] dark:text-[#E5E0D8] dark:hover:border-[#B89778] dark:hover:text-[#D4B89C]"
          >
            {theme === 'dark' ? (
              <>
                <svg
                  className="h-4 w-4 text-[#D4B89C]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
                <span className="hidden sm:inline">Светлая</span>
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 text-[#B85D3B]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
                <span className="hidden sm:inline">Тёмная</span>
              </>
            )}
          </button>

          {user ? (
            <>
              <span className="hidden items-center gap-2 text-xs text-[#3D302A] sm:inline-flex dark:text-[#D5CEC4]">
                <span>{user.fullName}</span>
                <span className="rounded-full border border-[#B85D3B]/25 bg-[#F5E6DF] px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-[#9E4B2D] dark:border-[#B89778]/30 dark:bg-[#B89778]/15 dark:text-[#D4B89C]">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#DFD3C3] bg-white px-4 py-2 text-xs font-medium text-[#2C221E] transition hover:border-[#B85D3B]/50 hover:bg-[#F3ECE2] dark:border-white/15 dark:bg-[#1E1C1A] dark:text-[#F5F3EF] dark:hover:border-[#B89778]/60 dark:hover:bg-[#282522]"
              >
                Выйти
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-full border border-[#DFD3C3] bg-white px-4 py-2 text-xs font-medium text-[#2C221E] transition hover:border-[#B85D3B]/50 hover:bg-[#F3ECE2] dark:border-white/15 dark:bg-[#1E1C1A] dark:text-[#F5F3EF] dark:hover:border-[#B89778]/60 dark:hover:bg-[#282522]"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#B85D3B] px-5 py-2 text-xs font-medium tracking-wide text-white shadow-xs transition hover:bg-[#9E4B2D] dark:bg-[#B89778] dark:text-[#141312] dark:hover:bg-[#CAB094]"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
