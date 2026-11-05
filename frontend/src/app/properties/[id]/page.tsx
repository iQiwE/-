'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
<<<<<<< Updated upstream
import { getSessionUser, getToken, SessionUser } from '@/lib/auth';
=======
import { AuthSession, getSessionUser, getToken, saveSession } from '@/lib/auth';
>>>>>>> Stashed changes
import { formatAddress, formatPrice } from '@/lib/format';
import { Property } from '@/types/property';

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
<<<<<<< Updated upstream
  const [user, setUser] = useState<SessionUser | null>(null);
=======
>>>>>>> Stashed changes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(tomorrow);
  const [leaseMonths, setLeaseMonths] = useState(12);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
<<<<<<< Updated upstream
    setUser(getSessionUser());
=======
>>>>>>> Stashed changes
    apiGet<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

<<<<<<< Updated upstream
  const isOwner = Boolean(user && property && user.id === property.ownerId);
  const isLandlord = user?.role === 'LANDLORD';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    const token = getToken();
    const currentUser = getSessionUser();

    // Если гость не авторизован — перенаправляем на страницу входа с возвратом обратно на карточку
    if (!token || !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }

    setSubmitting(true);
    try {
      if (property && currentUser.id === property.ownerId) {
        throw new Error('Нельзя подать заявку на аренду собственного объекта.');
      }
      if (currentUser.role !== 'TENANT') {
        throw new Error('Подавать заявки на аренду могут только пользователи с ролью TENANT.');
=======
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      let token = getToken();
      const user = getSessionUser();

      if (!token || user?.role !== 'TENANT') {
        const auth = await apiRequest<AuthSession>('POST', '/auth/login', {
          email: 'tenant@example.com',
          password: 'demo123',
        });
        saveSession(auth);
        token = auth.token;
        router.refresh();
>>>>>>> Stashed changes
      }

      await apiRequest(
        'POST',
        `/properties/${id}/applications`,
        { desiredStartDate: startDate, leaseMonths: Number(leaseMonths), message },
        token,
      );
      setSubmitResult('Заявка на аренду отправлена арендодателю.');
    } catch (err: any) {
      setSubmitError(err.message ?? 'Ошибка отправки заявки');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl p-8 text-gray-500">Загрузка...</div>;
  if (error || !property) {
    return <div className="mx-auto max-w-4xl p-8 text-red-600">Ошибка: {error ?? 'Объект не найден'}</div>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/catalog" className="text-sm text-blue-600 hover:underline">
        ← Назад в каталог
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {property.type.name} · {property.status}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{property.title}</h1>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatPrice(property.monthlyPrice)}{' '}
            <span className="text-sm font-normal text-gray-500">/ мес.</span>
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Комнат</dt>
              <dd className="font-medium">{property.rooms}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Площадь</dt>
              <dd className="font-medium">{property.area} м²</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Адрес</dt>
              <dd className="font-medium">
                {property.address.city}, р-н {property.address.district}, {formatAddress(property.address)}
              </dd>
            </div>
          </dl>

          {property.description && <p className="mt-4 text-sm text-gray-700">{property.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
<<<<<<< Updated upstream
          <h2 className="text-lg font-semibold text-gray-900">Оставить заявку на аренду</h2>

          {!user && (
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              Вы просматриваете объект как гость. При нажатии кнопки «Оставить заявку» вы будете перенаправлены на
              страницу входа.
            </div>
          )}

          {isOwner && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="alert">
              Это ваш объект недвижимости. Подача заявки на собственный объект запрещена.
            </div>
          )}

          {!isOwner && isLandlord && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="alert">
              Подача заявок доступна только пользователям с ролью TENANT (арендатор).
            </div>
          )}
=======
          <h2 className="text-lg font-semibold text-gray-900">Подать заявку на аренду</h2>
>>>>>>> Stashed changes

          <label className="flex flex-col gap-1 text-sm">
            Желаемая дата заселения
            <input
              type="date"
              required
<<<<<<< Updated upstream
              disabled={isOwner || isLandlord}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
=======
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
>>>>>>> Stashed changes
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Срок аренды (мес.)
            <input
              type="number"
              min={1}
              max={60}
              required
<<<<<<< Updated upstream
              disabled={isOwner || isLandlord}
              value={leaseMonths}
              onChange={(e) => setLeaseMonths(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
=======
              value={leaseMonths}
              onChange={(e) => setLeaseMonths(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2"
>>>>>>> Stashed changes
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Сообщение арендодателю
            <textarea
              rows={3}
<<<<<<< Updated upstream
              disabled={isOwner || isLandlord}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100"
=======
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
>>>>>>> Stashed changes
            />
          </label>

          {submitResult && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{submitResult}</p>}
          {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

          <button
            type="submit"
<<<<<<< Updated upstream
            disabled={submitting || isOwner || isLandlord || property.status !== 'AVAILABLE'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Отправка...' : 'Оставить заявку'}
=======
            disabled={submitting || property.status !== 'AVAILABLE'}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Отправка...' : 'Отправить заявку'}
>>>>>>> Stashed changes
          </button>
        </form>
      </div>
    </main>
  );
}
