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
<<<<<<< Updated upstream
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
=======
    setUser(getSessionUser());
>>>>>>> Stashed changes
  }, [pathname]);

  function handleLogout() {
    clearSession();
    setUser(null);
<<<<<<< Updated upstream
    router.push('/catalog');
=======
    router.push('/login');
>>>>>>> Stashed changes
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/catalog" className="font-bold text-gray-900">
            ИС Аренды Жилья
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/catalog" className="text-gray-600 hover:text-blue-600">
              Каталог
            </Link>
<<<<<<< Updated upstream
            {user?.role === 'LANDLORD' && (
              <Link href="/landlord" className="text-gray-600 hover:text-blue-600">
                Кабинет арендодателя
              </Link>
            )}
=======
            <Link href="/landlord" className="text-gray-600 hover:text-blue-600">
              Кабинет арендодателя
            </Link>
>>>>>>> Stashed changes
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-gray-700">
                {user.fullName} <span className="text-xs text-gray-500">({user.role})</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Выйти
              </button>
            </>
          ) : (
<<<<<<< Updated upstream
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Регистрация
              </Link>
            </div>
=======
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Войти
            </Link>
>>>>>>> Stashed changes
          )}
        </div>
      </div>
    </header>
  );
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
