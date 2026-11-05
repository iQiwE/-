'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'TENANT' | 'LANDLORD'>('TENANT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<AuthSession>('POST', '/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      saveSession(res);
      const nextUrl =
        redirectParam && redirectParam.startsWith('/')
          ? redirectParam
          : res.user.role === 'LANDLORD'
            ? '/landlord'
            : '/catalog';
      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">Регистрация аккаунта</h1>
      <p className="mt-1 text-sm text-gray-500">Создайте аккаунт арендатора или арендодателя</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          ФИО / Имя
          <input
            type="text"
            required
            placeholder="Например: Алексей Сериков"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Телефон (необязательно)
          <input
            type="tel"
            placeholder="+7 777 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Пароль
          <input
            type="password"
            required
            minLength={4}
            placeholder="Минимум 4 символа"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Роль в системе
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'TENANT' | 'LANDLORD')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="TENANT">Арендатор (TENANT) — поиск и подача заявок</option>
            <option value="LANDLORD">Арендодатель (LANDLORD) — сдача недвижимости</option>
          </select>
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
          {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link href={loginHref} className="font-semibold text-blue-600 hover:underline">
          Войти
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}

