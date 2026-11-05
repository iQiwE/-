'use client';

<<<<<<< Updated upstream
import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

=======
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      const nextUrl =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : res.user.role === 'LANDLORD'
            ? '/landlord'
            : '/catalog';
      router.push(nextUrl);
=======
      router.push(res.user.role === 'LANDLORD' ? '/landlord' : '/catalog');
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : '/register';

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">Вход в систему</h1>
      <p className="mt-1 text-sm text-gray-500">Введите учётные данные пользователя</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            placeholder="landlord@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Пароль
          <input
            type="password"
            required
            placeholder="demo123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Нет аккаунта?{' '}
        <Link href={registerHref} className="font-semibold text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </div>

      <div className="mt-6 border-t pt-4">
        <p className="text-xs font-medium text-gray-500">Быстрый вход под тестовыми аккаунтами:</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('landlord@example.com');
              setPassword('demo123');
              submitLogin('landlord@example.com', 'demo123');
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
=======
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Вход в систему</h1>
        <p className="mt-1 text-sm text-gray-500">Введите учётные данные пользователя</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              required
              placeholder="landlord@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Пароль
            <input
              type="password"
              required
              placeholder="demo123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs font-medium text-gray-500">Быстрый вход под тестовыми аккаунтами:</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('landlord@example.com');
                setPassword('demo123');
                submitLogin('landlord@example.com', 'demo123');
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Арендатор
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

>>>>>>> Stashed changes
