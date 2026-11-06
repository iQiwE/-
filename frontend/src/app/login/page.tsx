'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

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
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') && !redirectParam.startsWith('/\\');
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
    <div className="rounded-2xl border border-[#ECE2D6] bg-white p-8 shadow-[0_4px_24px_rgba(44,34,30,0.05)]">
      <h1 className="font-serif text-2xl font-semibold text-[#2C221E]">Вход в систему</h1>
      <p className="mt-1.5 text-sm text-[#6B5B50]">Введите учётные данные пользователя</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Email
          <input
            type="email"
            required
            placeholder="landlord@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm text-[#2C221E] focus:border-[#B85D3B] focus:bg-white focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
          Пароль
          <input
            type="password"
            required
            placeholder="demo123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm text-[#2C221E] focus:border-[#B85D3B] focus:bg-white focus:outline-none"
          />
        </label>

        {error && (
          <div className="rounded-xl bg-[#FDF2EE] p-3.5 text-sm text-[#9E3B24]" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-xl bg-[#B85D3B] px-5 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#9E4B2D] disabled:opacity-50"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[#6B5B50]">
        Нет аккаунта?{' '}
        <Link href={registerHref} className="font-semibold text-[#B85D3B] hover:underline">
          Зарегистрироваться
        </Link>
      </div>

      <div className="mt-6 border-t border-[#F0E7DC] pt-5">
        <p className="text-xs font-medium text-[#7A6A5E]">Быстрый вход под тестовыми аккаунтами:</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEmail('landlord@example.com');
              setPassword('demo123');
              submitLogin('landlord@example.com', 'demo123');
            }}
            className="rounded-xl border border-[#DFD3C3] bg-[#FAF6F0] px-3 py-2 text-xs font-medium text-[#3D302A] transition hover:border-[#B85D3B]/40 hover:bg-[#F3ECE2]"
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
            className="rounded-xl border border-[#DFD3C3] bg-[#FAF6F0] px-3 py-2 text-xs font-medium text-[#3D302A] transition hover:border-[#B85D3B]/40 hover:bg-[#F3ECE2]"
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
