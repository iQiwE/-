'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

const inputCls =
  'w-full rounded-full border border-[#6D3C52]/20 bg-[#FDF5F3] px-4 py-3 text-sm font-normal text-[#2C0107] transition-all duration-300 focus:border-[#C42759] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C42759]/20 dark:border-[#FADCD5]/15 dark:bg-[#1B0C1A] dark:text-[#FADCD5] dark:placeholder-[#B08D87] dark:focus:border-[#FADCD5]/45 dark:focus:ring-[#6D3C52]/40';

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
      setError(err.message ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  return (
    <div className="rounded-2xl border border-[#6D3C52]/12 bg-white p-5 shadow-[0_16px_44px_rgba(44,1,7,0.07)] transition-colors duration-300 sm:rounded-3xl sm:p-8 md:p-10 dark:border-[#FADCD5]/12 dark:bg-[#2D222F] dark:shadow-[0_20px_54px_rgba(11,4,11,0.6)]">
      <span className="inline-block rounded-full bg-[#FADCD5] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#550416] dark:bg-[#6D3C52] dark:text-[#FADCD5]">
        Новый профиль
      </span>
      <h1 className="mt-3 font-serif text-3xl font-normal text-[#2C0107] dark:text-[#FADCD5]">
        Регистрация <span className="italic text-[#C42759] dark:text-[#dcbab3]">аккаунта</span>
      </h1>
      <p className="mt-1.5 text-sm text-[#5A2D36] dark:text-[#DCBAB3]">Создайте аккаунт арендатора или арендодателя</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">ФИО / Имя</span>
          <input
            type="text"
            required
            placeholder="Например: Алексей Сериков"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Email</span>
          <input
            type="email"
            required
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Телефон (необязательно)</span>
          <input
            type="tel"
            placeholder="+7 777 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Пароль</span>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5A2D36] dark:text-[#DCBAB3]">
          <span className="pl-2">Роль в системе</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'TENANT' | 'LANDLORD')}
            className={inputCls}
          >
            <option value="TENANT">Арендатор (TENANT) — поиск и подача заявок</option>
            <option value="LANDLORD">Арендодатель (LANDLORD) — сдача недвижимости</option>
          </select>
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
          className="mt-2 rounded-full bg-[#C42759] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(196,39,89,0.28)] transition-all duration-300 hover:bg-[#550416] disabled:opacity-50 dark:bg-[#6D3C52] dark:text-[#FADCD5] dark:shadow-[0_8px_22px_rgba(0,0,0,0.4)] dark:hover:bg-[#4B2138]"
        >
          {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[#5A2D36] dark:text-[#DCBAB3]">
        Уже есть аккаунт?{' '}
        <Link href={loginHref} className="font-semibold text-[#C42759] hover:underline dark:text-[#FADCD5]">
          Войти
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-4 py-14">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
