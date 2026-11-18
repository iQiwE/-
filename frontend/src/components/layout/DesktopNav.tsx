'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSessionUser, SessionUser } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api/client';
import { useTheme } from '@/components/ThemeProvider';
import { useConcierge } from '@/components/concierge/ConciergeChat';

export function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isConciergeOpen, toggleConcierge, openConcierge } = useConcierge();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    const cached = getSessionUser();
    setUser(cached);

    if (cached) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/auth/me`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    clearSession();
    setUser(null);
    setMobileMenuOpen(false);
    router.push('/catalog');
  }

  return (
    <>
      <header
        data-scrolled={isScrolled}
        className={`fixed top-0 left-0 z-50 w-full border-b border-[#6D3C52]/12 transition-all duration-300 dark:border-gray-800 ${
          isScrolled
            ? 'bg-[#FDF5F3]/75 backdrop-blur-md shadow-[0_8px_30px_rgba(44,1,7,0.08)] dark:bg-[#1B0C1A]/70 dark:backdrop-blur-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
            : 'bg-[#FDF5F3] dark:bg-[#1B0C1A]'
        }`}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3.5 md:h-16 md:px-8">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/catalog"
              className="group inline-flex items-center gap-2.5 font-serif text-base font-medium tracking-tight text-[#2C0107] transition sm:text-xl dark:text-[#FADCD5]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C42759] to-[#550416] font-serif text-[10px] font-bold tracking-wider text-white shadow-[0_6px_18px_rgba(196,39,89,0.3)] transition duration-300 group-hover:scale-105 sm:h-9 sm:w-9 sm:text-xs dark:from-[#6D3C52] dark:to-[#4B2138] dark:text-[#FADCD5] dark:shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
                ВКО
              </span>
              <span className="flex items-baseline gap-1.5">
                <span>Velvet</span>
                <span className="font-serif text-sm italic font-normal text-[#C42759] sm:text-lg dark:text-[#dcbab3]">
                  Residence
                </span>
              </span>
            </Link>

            {/* Десктопная навигация — скрыта на мобильных */}
            <nav className="hidden items-center gap-2 md:flex" aria-label="Основная навигация">
              <Link
                href="/catalog"
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  pathname === '/catalog'
                    ? 'bg-[#FADCD5] text-[#550416] shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'text-[#5A2D36] hover:bg-[#FADCD5]/50 hover:text-[#2C0107] dark:text-[#DCBAB3] dark:hover:bg-[#2D222F] dark:hover:text-[#FADCD5]'
                }`}
              >
                Каталог
              </Link>

              {user?.role === 'TENANT' && (
                <Link
                  href="/favorites"
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                    pathname === '/favorites'
                      ? 'bg-[#FADCD5] text-[#550416] shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'text-[#5A2D36] hover:bg-[#FADCD5]/50 hover:text-[#2C0107] dark:text-[#DCBAB3] dark:hover:bg-[#2D222F] dark:hover:text-[#FADCD5]'
                  }`}
                >
                  <span className="text-[#C42759] dark:text-[#FADCD5]">♥</span> Избранное
                </Link>
              )}

              {user?.role === 'LANDLORD' && (
                <Link
                  href="/landlord"
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                    pathname === '/landlord'
                      ? 'bg-[#FADCD5] text-[#550416] shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'text-[#5A2D36] hover:bg-[#FADCD5]/50 hover:text-[#2C0107] dark:text-[#DCBAB3] dark:hover:bg-[#2D222F] dark:hover:text-[#FADCD5]'
                  }`}
                >
                  Кабинет арендодателя
                </Link>
              )}

              <Link
                href="/faq"
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  pathname === '/faq'
                    ? 'bg-[#FADCD5] text-[#550416] shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'text-[#5A2D36] hover:bg-[#FADCD5]/50 hover:text-[#2C0107] dark:text-[#DCBAB3] dark:hover:bg-[#2D222F] dark:hover:text-[#FADCD5]'
                }`}
              >
                FAQ
              </Link>

              <button
                type="button"
                onClick={toggleConcierge}
                data-testid="desktop-concierge-btn"
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-300 ${
                  isConciergeOpen
                    ? 'bg-[#C42759] text-white shadow-2xs dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'border border-[#C42759]/25 bg-[#FADCD5]/55 text-[#550416] hover:bg-[#FADCD5] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                </svg>
                <span>Консьерж</span>
              </button>
            </nav>
          </div>

          {/* Десктопный блок управления — скрыт на мобильных (hidden md:flex) */}
          <div className="hidden shrink-0 items-center gap-3 text-sm md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Переключить на светлую пудровую тему' : 'Переключить на тёмную сливовую тему'}
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-2 rounded-full border border-[#6D3C52]/15 bg-white px-4 py-2 text-xs font-semibold text-[#2C0107] shadow-[0_4px_14px_rgba(44,1,7,0.06)] transition-all duration-300 hover:border-[#C42759] hover:text-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)] dark:hover:border-[#6D3C52] dark:hover:bg-[#6D3C52]"
            >
              {theme === 'dark' ? (
                <>
                  <svg
                    className="h-4 w-4 text-[#FADCD5]"
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
                  <span>Светлая</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 text-[#C42759]"
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
                  <span>Тёмная</span>
                </>
              )}
            </button>

            {user ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#6D3C52]/12 bg-white/80 px-3.5 py-1.5 text-xs text-[#2C0107] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]">
                  <span className="max-w-[140px] truncate font-medium">{user.fullName}</span>
                  <span className="rounded-full bg-[#FADCD5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="shrink-0 whitespace-nowrap rounded-full border border-[#6D3C52]/15 bg-white px-4 py-2 text-xs font-semibold text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:bg-[#FADCD5]/40 dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="shrink-0 whitespace-nowrap rounded-full border border-[#6D3C52]/15 bg-white px-4 py-2 text-xs font-semibold text-[#2C0107] shadow-2xs transition-all duration-300 hover:border-[#C42759] hover:bg-[#FADCD5]/40 dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="shrink-0 whitespace-nowrap rounded-full bg-[#C42759] px-5 py-2 text-xs font-semibold tracking-wide text-white shadow-[0_6px_18px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_6px_18px_rgba(0,0,0,0.4)] dark:hover:bg-[#4B2138]"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>

          {/* Мобильная кнопка Бургер-меню (видна только на мобильных — md:hidden) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Закрыть мобильное меню' : 'Открыть мобильное меню'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6D3C52]/15 bg-white text-[#2C0107] shadow-2xs transition duration-300 hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]"
            >
              {mobileMenuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Выезжающее сбоку мобильное меню (Drawer) */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-[#1B0C1A]/70 backdrop-blur-sm transition-opacity duration-300"
        />

        <aside
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col justify-between border-l border-[#6D3C52]/12 bg-[#FDF5F3] p-6 shadow-2xl transition-transform duration-300 ease-out dark:border-gray-800 dark:bg-[#1B0C1A] ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#6D3C52]/12 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#C42759] to-[#550416] font-serif text-[11px] font-bold text-white dark:from-[#6D3C52] dark:to-[#4B2138] dark:text-[#FADCD5]">
                  ВКО
                </span>
                <span className="font-serif text-base font-medium text-[#2C0107] dark:text-[#FADCD5]">
                  Меню <span className="italic text-[#C42759] dark:text-[#dcbab3]">навигации</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Закрыть меню"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6D3C52]/15 bg-white text-[#2C0107] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]"
              >
                ✕
              </button>
            </div>

            {user && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#6D3C52]/12 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-[#2D222F]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2C0107] dark:text-[#FADCD5]">{user.fullName}</p>
                  <p className="truncate text-xs text-[#5A2D36] dark:text-[#DCBAB3]">{user.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#FADCD5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                  {user.role}
                </span>
              </div>
            )}

            <nav className="flex flex-col gap-2" aria-label="Мобильная навигация">
              <Link
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold transition-all ${
                  pathname === '/catalog'
                    ? 'bg-[#C42759] text-white shadow-sm dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'border border-[#6D3C52]/12 bg-white text-[#2C0107] hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                }`}
              >
                <span>Каталог резиденций</span>
                <span>→</span>
              </Link>

              {user?.role === 'TENANT' && (
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold transition-all ${
                    pathname === '/favorites'
                      ? 'bg-[#C42759] text-white shadow-sm dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'border border-[#6D3C52]/12 bg-white text-[#2C0107] hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                  }`}
                >
                  <span>♥ Избранное</span>
                  <span>→</span>
                </Link>
              )}

              {user?.role === 'LANDLORD' && (
                <Link
                  href="/landlord"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold transition-all ${
                    pathname === '/landlord'
                      ? 'bg-[#C42759] text-white shadow-sm dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                      : 'border border-[#6D3C52]/12 bg-white text-[#2C0107] hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                  }`}
                >
                  <span>Кабинет арендодателя</span>
                  <span>→</span>
                </Link>
              )}

              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-semibold transition-all ${
                  pathname === '/faq'
                    ? 'bg-[#C42759] text-white shadow-sm dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                    : 'border border-[#6D3C52]/12 bg-white text-[#2C0107] hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]'
                }`}
              >
                <span>Частые вопросы (FAQ)</span>
                <span>→</span>
              </Link>

              <button
                type="button"
                data-testid="mobile-menu-concierge-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openConcierge();
                }}
                className="flex h-12 w-full items-center justify-between rounded-full border border-[#C42759]/25 bg-[#FADCD5]/70 px-5 text-sm font-semibold text-[#550416] transition-all hover:bg-[#C42759] hover:text-white dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5] dark:hover:bg-[#6D3C52]"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#C42759] dark:text-[#FADCD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                  <span>Персональный консьерж</span>
                </span>
                <span>💬</span>
              </button>
            </nav>

            <div className="border-t border-[#6D3C52]/12 pt-4 dark:border-gray-800">
              <p className="mb-2.5 pl-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#845962] dark:text-[#B08D87]">
                Оформление интерфейса
              </p>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-12 w-full items-center justify-between rounded-full border border-[#6D3C52]/15 bg-white px-5 text-sm font-semibold text-[#2C0107] shadow-2xs transition hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]"
              >
                <span className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <>
                      <span>☀️</span>
                      <span>Светлая пудровая тема</span>
                    </>
                  ) : (
                    <>
                      <span>🌙</span>
                      <span>Тёмная сливовая тема</span>
                    </>
                  )}
                </span>
                <span className="rounded-full bg-[#FADCD5] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
                  Сменить
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#6D3C52]/12 pt-4 dark:border-gray-800">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 w-full items-center justify-center rounded-full border border-[#C42759]/30 bg-[#FADCD5]/60 px-5 text-sm font-semibold text-[#550416] transition hover:bg-[#C42759] hover:text-white dark:border-gray-800 dark:bg-[#4B2138] dark:text-[#FADCD5]"
              >
                Выйти из аккаунта
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-[#6D3C52]/15 bg-white px-5 text-sm font-semibold text-[#2C0107] shadow-2xs transition hover:border-[#C42759] dark:border-gray-800 dark:bg-[#2D222F] dark:text-[#FADCD5]"
                >
                  Войти в систему
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[#C42759] px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(196,39,89,0.28)] transition hover:bg-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
