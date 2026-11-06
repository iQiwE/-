'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiRequest } from '@/lib/api/client';
import { propertiesApi } from '@/lib/api/properties.api';
import { getSessionUser, getToken, SessionUser } from '@/lib/auth';
import { FALLBACK_UNSPLASH_URLS, formatAddress, formatPrice, resolvePropertyImageUrl } from '@/lib/format';
import { Property } from '@/types/property';

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
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
    const currentUser = getSessionUser();
    const token = getToken();
    setUser(currentUser);

    apiGet<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    if (token && currentUser?.role === 'TENANT') {
      propertiesApi
        .getFavorites(token)
        .then((favs) => setIsFavorite(favs.some((f) => f.id === id)))
        .catch(() => {});
    }
  }, [id]);

  const isOwner = Boolean(user && property && user.role === 'LANDLORD' && user.id === property.ownerId);
  const isLandlord = user?.role === 'LANDLORD';

  async function handleToggleFavorite() {
    const token = getToken();
    const currentUser = getSessionUser();
    if (!token || !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }
    if (currentUser.role !== 'TENANT') return;

    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      if (prev) {
        await propertiesApi.removeFavorite(id, token);
      } else {
        await propertiesApi.addFavorite(id, token);
      }
    } catch {
      setIsFavorite(prev);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    const token = getToken();
    const currentUser = getSessionUser();

    if (!token || !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }

    setSubmitting(true);
    try {
      if (property && currentUser.role === 'LANDLORD' && currentUser.id === property.ownerId) {
        throw new Error('Нельзя подать заявку на аренду собственного объекта.');
      }
      if (currentUser.role !== 'TENANT') {
        throw new Error('Подавать заявки на аренду могут только пользователи с ролью TENANT.');
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

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-14 text-[#6B5B50]">Загрузка объекта...</div>;
  if (error || !property) {
    return <div className="mx-auto max-w-5xl px-6 py-14 text-[#9E3B24]">Ошибка: {error ?? 'Объект не найден'}</div>;
  }

  const imgSrc = resolvePropertyImageUrl(property.image_url, property.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#B85D3B] hover:underline">
        ← Назад в каталог
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#ECE2D6] bg-white shadow-[0_4px_24px_rgba(44,34,30,0.05)]">
          <div className="relative h-72 w-full bg-[#EFE6DC]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={property.title}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_UNSPLASH_URLS[0]) {
                  target.src = FALLBACK_UNSPLASH_URLS[0];
                }
              }}
              className="h-72 w-full object-cover"
            />
          </div>

          <div className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F5E6DF] px-3.5 py-1 text-xs font-medium text-[#9E4B2D]">
                  {property.type.name} · {property.status}
                </span>
                {property.is_good_price && (
                  <span className="rounded-full bg-[#4D724D] px-3.5 py-1 text-xs font-semibold text-white">
                    🔥 Хорошая цена (ниже рынка по р-ну {property.address.district})
                  </span>
                )}
              </div>

              {(!user || user.role === 'TENANT') && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                    isFavorite
                      ? 'border-[#E8CFC4] bg-[#FAF0EB] text-[#B85D3B]'
                      : 'border-[#E2D6C8] bg-[#FAF6F0] text-[#3D302A] hover:border-[#B85D3B]/40'
                  }`}
                >
                  <span className={isFavorite ? 'text-[#B85D3B]' : 'text-[#8E7D70]'}>♥</span>
                  {isFavorite ? 'В избранном' : 'В избранное'}
                </button>
              )}
            </div>

            <h1 className="mt-4 font-serif text-3xl font-semibold text-[#2C221E]">{property.title}</h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="text-2xl font-bold text-[#B85D3B]">
                {formatPrice(property.monthlyPrice)}{' '}
                <span className="text-sm font-normal text-[#7A6A5E]">/ мес.</span>
              </p>
              {property.districtAvgPrice && (
                <span className="text-xs text-[#6B5B50]">
                  Средняя по р-ну {property.address.district}: {formatPrice(property.districtAvgPrice)}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {property.petsAllowed && (
                <span className="rounded-xl bg-[#F2F6F2] px-3 py-1 text-xs font-medium text-[#3B593B]">
                  🐾 Можно с питомцами
                </span>
              )}
              {property.noDeposit && (
                <span className="rounded-xl bg-[#FAF0EB] px-3 py-1 text-xs font-medium text-[#8E4226]">
                  ⚡ Без залога
                </span>
              )}
              {property.fromOwner && (
                <span className="rounded-xl bg-[#FBF5ED] px-3 py-1 text-xs font-medium text-[#785027]">
                  👤 От хозяина
                </span>
              )}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-[#FAF6F0] p-4 text-sm">
              <div>
                <dt className="text-xs text-[#7A6A5E]">Комнат</dt>
                <dd className="mt-0.5 font-medium text-[#2C221E]">{property.rooms}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7A6A5E]">Площадь</dt>
                <dd className="mt-0.5 font-medium text-[#2C221E]">{property.area} м²</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-[#7A6A5E]">Адрес</dt>
                <dd className="mt-0.5 font-medium text-[#2C221E]">
                  {property.address.city}, р-н {property.address.district}, {formatAddress(property.address)}
                </dd>
              </div>
            </dl>

            {property.description && (
              <p className="mt-6 text-sm leading-relaxed text-[#5C4D44]">{property.description}</p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 self-start rounded-2xl border border-[#ECE2D6] bg-white p-8 shadow-[0_4px_24px_rgba(44,34,30,0.05)]"
        >
          <h2 className="font-serif text-xl font-semibold text-[#2C221E]">Оставить заявку на аренду</h2>

          {!user && (
            <div className="rounded-xl bg-[#F5E6DF] p-3.5 text-xs leading-relaxed text-[#7A3821]">
              Вы просматриваете объект как гость. При нажатии кнопки «Оставить заявку» вы будете перенаправлены на
              страницу входа.
            </div>
          )}

          {isOwner && (
            <div className="rounded-xl bg-[#FBF5ED] p-3.5 text-sm text-[#785027]" role="alert">
              Это ваш объект недвижимости. Подача заявки на собственный объект запрещена.
            </div>
          )}

          {!isOwner && isLandlord && (
            <div className="rounded-xl bg-[#FBF5ED] p-3.5 text-sm text-[#785027]" role="alert">
              Подача заявок доступна только пользователям с ролью TENANT (арендатор).
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
            Желаемая дата заселения
            <input
              type="date"
              required
              disabled={isOwner || isLandlord}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] focus:border-[#B85D3B] focus:bg-white focus:outline-none disabled:bg-[#F3ECE2]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
            Срок аренды (мес.)
            <input
              type="number"
              min={1}
              max={60}
              required
              disabled={isOwner || isLandlord}
              value={leaseMonths}
              onChange={(e) => setLeaseMonths(Number(e.target.value))}
              className="rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] focus:border-[#B85D3B] focus:bg-white focus:outline-none disabled:bg-[#F3ECE2]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#3D302A]">
            Сообщение арендодателю
            <textarea
              rows={3}
              disabled={isOwner || isLandlord}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border border-[#E2D6C8] bg-[#FAF6F0]/60 px-3.5 py-2.5 text-sm font-normal text-[#2C221E] focus:border-[#B85D3B] focus:bg-white focus:outline-none disabled:bg-[#F3ECE2]"
            />
          </label>

          {submitResult && <p className="rounded-xl bg-[#F2F6F2] p-3.5 text-sm text-[#3B593B]">{submitResult}</p>}
          {submitError && <p className="rounded-xl bg-[#FDF2EE] p-3.5 text-sm text-[#9E3B24]">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting || isOwner || isLandlord || property.status !== 'AVAILABLE'}
            className="mt-1 rounded-xl bg-[#B85D3B] px-5 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#9E4B2D] disabled:opacity-50"
          >
            {submitting ? 'Отправка...' : 'Оставить заявку'}
          </button>
        </form>
      </div>
    </main>
  );
}
