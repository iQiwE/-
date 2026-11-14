'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUser, SessionUser } from '@/lib/auth';
import { useConcierge } from '@/components/concierge/ConciergeChat';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { isOpen: isConciergeOpen, toggleConcierge } = useConcierge();

  useEffect(() => {
    setUser(getSessionUser());
  }, [pathname]);

  const isCatalog = pathname === '/catalog' || pathname === '/';
  const isFavorites = pathname === '/favorites';
  const isLandlord = pathname === '/landlord';
  const isFaq = pathname === '/faq';
  const isAuth = pathname === '/login' || pathname === '/register';

  return (
    <nav
      aria-label="Нижняя панель навигации"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[#6D3C52]/12 bg-[#FDF5F3]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-colors duration-300 md:hidden dark:border-gray-800 dark:bg-[#1B0C1A]/95"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
        <Link
          href="/catalog"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isCatalog && !isConciergeOpen
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
              isCatalog && !isConciergeOpen ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </span>
          <span>Поиск</span>
        </Link>

        {user?.role === 'LANDLORD' ? (
          <Link
            href="/landlord"
            className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
              isLandlord && !isConciergeOpen
                ? 'text-[#C42759] dark:text-[#FADCD5]'
                : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
            }`}
          >
            <span
              className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                isLandlord && !isConciergeOpen ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            <span>Кабинет</span>
          </Link>
        ) : (
          <Link
            href="/favorites"
            className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
              isFavorites && !isConciergeOpen
                ? 'text-[#C42759] dark:text-[#FADCD5]'
                : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
            }`}
          >
            <span
              className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                isFavorites && !isConciergeOpen ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </span>
            <span>Избранное</span>
          </Link>
        )}

        <button
          type="button"
          onClick={toggleConcierge}
          data-testid="mobile-bottom-concierge-btn"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isConciergeOpen
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
              isConciergeOpen
                ? 'bg-[#C42759] text-white dark:bg-[#6D3C52] dark:text-[#FADCD5]'
                : 'bg-[#FADCD5]/70 text-[#550416] dark:bg-[#2D222F] dark:text-[#FADCD5]'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
          </span>
          <span>Консьерж</span>
        </button>

        <Link
          href="/faq"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isFaq && !isConciergeOpen
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
              isFaq && !isConciergeOpen ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
          </span>
          <span>Вопросы</span>
        </Link>

        <Link
          href={user ? (user.role === 'LANDLORD' ? '/landlord' : '/favorites') : '/login'}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isAuth && !isConciergeOpen
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
              isAuth && !isConciergeOpen ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </span>
          <span className="max-w-[64px] truncate">{user ? user.fullName.split(' ')[0] : 'Профиль'}</span>
        </Link>
      </div>
    </nav>
  );
}
