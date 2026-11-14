'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

const inputCls =
  'h-12 w-full rounded-full border border-[#6D3C52]/15 bg-[#FDF5F3] px-4 text-sm font-normal text-[#2C0107] transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 dark:border-gray-800 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:placeholder-[#B08D87] dark:focus:border-[#6D3C52] dark:focus:ring-[#6D3C52]/40';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin(targetEmail: string, targetPassword: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<AuthSession>('POST', '/auth/login', {
        email: targetEmail.trim(),
        password: targetPassword,
      });
      saveSession(res);
      const isSafeRelativeRedirect =
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('//') &&
        !redirectParam.startsWith('/\\');
      const nextUrl = isSafeRelativeRedirect
        ? redirectParam
        : res.user.role === 'LANDLORD'
          ? '/landlord'
          : '/catalog';
      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitLogin(email, password);
  }

  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : '/register';

  return (
    <div className="rounded-2xl border border-[#6D3C52]/12 bg-white p-5 shadow-[0_16px_44px_rgba(44,1,7,0.07)] transition-colors duration-300 sm:rounded-3xl sm:p-8 md:p-10 dark:border-gray-800 dark:bg-[#2D222F] dark:shadow-[0_20px_54px_rgba(11,4,11,0.6)]">
      <span className="inline-block rounded-full bg-[#FADCD5] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
        Авторизация
      </span>
      <h1 className="mt-3 font-serif text-3xl font-normal text-[#2C0107] dark:text-[#FADCD5]">
        Вход в <span className="italic text-[#C42759] dark:text-[#dcbab3]">систему</span>
      </h1>
      <p className="mt-1.5 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">Введите учётные данные пользователя</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Email</span>
          <input
            type="email"
            required
            placeholder="landlord@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Пароль</span>
          <input
            type="password"
            required
            placeholder="demo123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </label>

        {error && (
          <div
            className="rounded-2xl border border-[#C42759]/30 bg-[#FADCD5]/55 p-3.5 text-sm text-[#550416] dark:border-[#FADCD5]/20 dark:bg-[#4B2138] dark:text-[#FADCD5]"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-full bg-[#C42759] px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] disabled:opacity-50 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_8px_22px_rgba(0,0,0,0.4)] dark:hover:bg-[#4B2138]"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
        Нет аккаунта?{' '}
        <Link href={registerHref} className="font-semibold text-[#C42759] hover:underline dark:text-[#FADCD5]">
          Зарегистрироваться
        </Link>
      </div>

      <div className="mt-6 border-t border-[#6D3C52]/12 pt-5 dark:border-gray-800">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#845962] dark:text-[#B08D87]">
          Быстрый вход под тестовыми аккаунтами:
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEmail('landlord@example.com');
              setPassword('demo123');
              submitLogin('landlord@example.com', 'demo123');
            }}
            className="h-12 w-full rounded-full border border-[#6D3C52]/15 bg-[#FDF5F3] px-3 text-xs font-semibold text-[#2C0107] transition-all duration-300 hover:border-[#C42759] hover:bg-[#FADCD5]/60 dark:border-gray-800 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
          >
            Арендодатель
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('tenant@example.com');
              setPassword('demo123');
              submitLogin('tenant@example.com', 'demo123');
            }}
            className="h-12 w-full rounded-full border border-[#6D3C52]/15 bg-[#FDF5F3] px-3 text-xs font-semibold text-[#2C0107] transition-all duration-300 hover:border-[#C42759] hover:bg-[#FADCD5]/60 dark:border-gray-800 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:hover:bg-[#4B2138]"
          >
            Арендатор
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-14">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
