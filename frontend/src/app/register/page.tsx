'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { AuthSession, saveSession } from '@/lib/auth';

const inputCls =
  'rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/70 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] transition focus:border-[#B85D3B] focus:bg-white focus:outline-none dark:border-white/12 dark:bg-[#141312] dark:text-[#F5F3EF] dark:placeholder-[#7A7067] dark:focus:border-[#B89778] dark:focus:bg-[#181614]';

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
    <div className="rounded-2xl border border-[#ECE2D6] bg-white p-8 shadow-[0_4px_24px_rgba(44,34,30,0.05)] transition-colors duration-300 dark:border-white/10 dark:bg-[#1C1A18] dark:shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#B85D3B] dark:text-[#B89778]">
        Новый профиль
      </span>
      <h1 className="mt-2 font-serif text-3xl font-normal text-[#2C221E] dark:text-[#F5F3EF]">
        Регистрация <span className="italic text-[#B85D3B] dark:text-[#B89778]">аккаунта</span>
      </h1>
      <p className="mt-1.5 text-sm text-[#6B5B50] dark:text-[#A8A096]">Создайте аккаунт арендатора или арендодателя</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
          ФИО / Имя
          <input
            type="text"
            required
            placeholder="Например: Алексей Сериков"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
          Email
          <input
            type="email"
            required
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
          Телефон (необязательно)
          <input
            type="tel"
            placeholder="+7 777 000 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
          Пароль
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

        <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wider text-[#3D302A] dark:text-[#C7BFB5]">
          Роль в системе
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
            className="rounded-xl border border-[#E8C5B8] bg-[#FDF2EE] p-3.5 text-sm text-[#9E3B24] dark:border-[#E06C53]/30 dark:bg-[#2A1916] dark:text-[#F29B88]"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-[#B85D3B] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs transition hover:bg-[#9E4B2D] disabled:opacity-50 dark:bg-[#B89778] dark:text-[#141312] dark:hover:bg-[#CAB094]"
        >
          {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-[#6B5B50] dark:text-[#A8A096]">
        Уже есть аккаунт?{' '}
        <Link href={loginHref} className="font-semibold text-[#B85D3B] hover:underline dark:text-[#D4B89C]">
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
