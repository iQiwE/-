'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUser, SessionUser } from '@/lib/auth';

export function BottomTabBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, [pathname]);

  const isCatalog = pathname === '/catalog' || pathname === '/';
  const isFavorites = pathname === '/favorites';
  const isLandlord = pathname === '/landlord';
  const isAuth = pathname === '/login' || pathname === '/register';

  return (
    <nav
      aria-label="Нижняя панель навигации"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[#6D3C52]/15 bg-[#FDF5F3]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-colors duration-300 md:hidden dark:border-[#FADCD5]/12 dark:bg-[#1B0C1A]/95"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
        <Link
          href="/catalog"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isCatalog
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              isCatalog ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
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

        <Link
          href="/favorites"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isFavorites
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              isFavorites ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
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

        <Link
          href="/landlord"
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isLandlord
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              isLandlord ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <span>Подать</span>
        </Link>

        <Link
          href={user ? (user.role === 'LANDLORD' ? '/landlord' : '/favorites') : '/login'}
          className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
            isAuth
              ? 'text-[#C42759] dark:text-[#FADCD5]'
              : 'text-[#845962] hover:text-[#2C0107] dark:text-[#B08D87] dark:hover:text-[#FADCD5]'
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              isAuth ? 'bg-[#FADCD5] dark:bg-[#6D3C52]' : ''
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
          <span className="max-w-[72px] truncate">{user ? user.fullName.split(' ')[0] : 'Кабинет'}</span>
        </Link>
      </div>
    </nav>
  );
}
