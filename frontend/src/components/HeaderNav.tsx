'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSessionUser, SessionUser } from '@/lib/auth';

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
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
    <header className="sticky top-0 z-30 border-b border-[#E8DFD3] bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/catalog" className="inline-flex items-center gap-3 font-serif text-xl font-semibold text-[#2C221E]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B85D3B] font-serif text-sm font-bold text-white">
              ВКО
            </span>
            <span>ИС Аренды Жилья</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/catalog"
              className={`transition hover:text-[#B85D3B] ${
                pathname === '/catalog' ? 'font-semibold text-[#B85D3B]' : 'text-[#5C4D44]'
              }`}
            >
              Каталог
            </Link>
            {user?.role === 'TENANT' && (
              <Link
                href="/favorites"
                className={`inline-flex items-center gap-1.5 transition hover:text-[#B85D3B] ${
                  pathname === '/favorites' ? 'font-semibold text-[#B85D3B]' : 'text-[#5C4D44]'
                }`}
              >
                <span className="text-[#B85D3B]">♥</span> Избранное
              </Link>
            )}
            {user?.role === 'LANDLORD' && (
              <Link
                href="/landlord"
                className={`transition hover:text-[#B85D3B] ${
                  pathname === '/landlord' ? 'font-semibold text-[#B85D3B]' : 'text-[#5C4D44]'
                }`}
              >
                Кабинет арендодателя
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3.5 text-sm">
          {user ? (
            <>
              <span className="text-[#3D302A]">
                {user.fullName}{' '}
                <span className="rounded-full bg-[#F5E6DF] px-2.5 py-0.5 text-xs font-medium text-[#9E4B2D]">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[#DFD3C3] bg-[#FAF6F0] px-4 py-2 text-xs font-medium text-[#2C221E] transition hover:border-[#B85D3B]/40 hover:bg-[#F3ECE2]"
              >
                Выйти
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-xl border border-[#DFD3C3] bg-[#FAF6F0] px-4 py-2 text-xs font-medium text-[#2C221E] transition hover:border-[#B85D3B]/40 hover:bg-[#F3ECE2]"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#B85D3B] px-4 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-[#9E4B2D]"
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
